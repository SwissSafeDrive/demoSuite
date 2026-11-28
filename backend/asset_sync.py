"""Synchronize the manifest and its verified files into the local asset cache."""

import hashlib
import json
import re
import ssl
from concurrent.futures import CancelledError, ThreadPoolExecutor, as_completed
from contextlib import contextmanager, nullcontext
from http.client import HTTPException, HTTPSConnection
from pathlib import Path, PurePosixPath
from tempfile import NamedTemporaryFile
from threading import Event, Lock, Thread
from urllib.error import HTTPError
from urllib.parse import quote, urlsplit

ASSET_CONTAINER = "demo-assets"
ASSET_PREFIX = "v1"
CHUNK_SIZE = 1024 * 1024


def azure_blob_url(url):
    try:
        parts = urlsplit(url)
        if (
            parts.scheme == "https"
            and re.fullmatch(r"[a-z0-9]+\.blob\.core\.windows\.net", parts.netloc)
            and parts.path in ("", "/", f"/{ASSET_CONTAINER}", f"/{ASSET_CONTAINER}/")
            and parts.query
            and not parts.fragment
            and not any(character.isspace() for character in url)
        ):
            return parts
    except ValueError:
        pass
    raise ValueError("Enter a valid HTTPS Azure Blob read SAS URL")


class BlobRequests:
    """Reuse TLS connections across the asset downloads in one sync."""

    def __init__(self, host):
        self.host = host
        self.context = ssl.create_default_context()
        self.lock = Lock()
        self.idle = []

    def __enter__(self):
        return self.open

    def __exit__(self, *_):
        for connection in self.idle:
            connection.close()

    def _connect(self):
        return HTTPSConnection(self.host, context=self.context, timeout=30)

    @staticmethod
    def _get(connection, target):
        try:
            connection.request("GET", target)
            return connection.getresponse()
        except (OSError, HTTPException):
            connection.close()
            raise

    @contextmanager
    def open(self, url):
        parts = urlsplit(url)
        target = f"{parts.path}?{parts.query}"
        with self.lock:
            reused = self.idle.pop() if self.idle else None
        connection = reused or self._connect()
        try:
            response = self._get(connection, target)
        except (OSError, HTTPException):
            if reused is None:
                raise
            connection = self._connect()
            response = self._get(connection, target)

        try:
            with response:
                if response.status != 200:
                    raise HTTPError(None, response.status, "Blob request failed", None, None)
                yield response
                if response.isclosed() and connection.sock is not None:
                    with self.lock:
                        self.idle.append(connection)
                    connection = None
        finally:
            if connection is not None:
                connection.close()


@contextmanager
def atomic_write(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    file = NamedTemporaryFile(dir=path.parent, suffix=".part", delete=False)
    temporary = Path(file.name)
    try:
        with file:
            yield file
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def manifest_entries(manifest, root):
    if manifest["version"] != 1 or not isinstance(manifest["files"], list):
        raise ValueError("Invalid asset manifest")
    entries = {}
    for entry in manifest["files"]:
        name, size, digest = entry["path"], entry["size"], entry["sha256"]
        path = PurePosixPath(name)
        if (
            not path.parts or path.is_absolute() or str(path) != name
            or any(part.startswith(".") for part in path.parts)
            or name in entries or path.parts[0] == "manifest.json"
            or not (root / name).resolve().is_relative_to(root)
            or type(size) is not int or size < 0
            or not re.fullmatch(r"[0-9a-f]{64}", digest)
        ):
            raise ValueError("Invalid asset manifest entry")
        entries[name] = (size, digest)
    return entries


def fingerprint(path, digest):
    stat = path.stat()
    return [stat.st_size, stat.st_mtime_ns, stat.st_ctime_ns, digest]


def verified_file(path, size, digest, previous):
    try:
        identity = fingerprint(path, digest)
        if identity[0] != size:
            return None
        if identity != previous:
            with path.open("rb") as file:
                if hashlib.file_digest(file, "sha256").hexdigest() != digest:
                    return None
            if identity != fingerprint(path, digest):
                return None
        return identity
    except (FileNotFoundError, IsADirectoryError):
        return None


class AssetSync:
    def __init__(self, root, settings, opener=None):
        self.root = root.resolve()
        self.settings = settings
        self.opener = opener
        self.lock = Lock()
        self.worker = None
        self.stopping = Event()
        self.pending = False
        self.progress = self._progress("idle", False)

    def status(self):
        with self.lock:
            return self.progress.copy()

    def start(self):
        with self.lock:
            self._schedule()

    def paste(self, url):
        azure_blob_url(url)
        with self.lock:
            with atomic_write(self.root / ".read-sas") as file:
                file.write(url.encode("utf-8"))
            self._schedule()

    def stop(self):
        self.stopping.set()
        self.wait()

    def wait(self):
        with self.lock:
            worker = self.worker
        if worker is not None:
            worker.join()

    def _schedule(self):
        self.pending = True
        if self.worker is None:
            self.stopping.clear()
            self._prepare()
            self.worker = Thread(target=self._run, daemon=True)
            self.worker.start()

    def _prepare(self):
        self.pending = False
        url = self.settings.get("DEMO_ASSETS_READ_SAS_URL")
        read_failed = False
        if not url:
            try:
                url = (self.root / ".read-sas").read_text(encoding="utf-8").strip()
            except FileNotFoundError:
                pass
            except (OSError, UnicodeError):
                read_failed = True
        self.url = url
        self.progress = self._progress("checking" if url else "missing_sas", bool(url))
        if read_failed:
            self.progress.update(
                state="error",
                error={"code": "sas_read_failed", "message": "Could not read the saved SAS"},
            )

    @staticmethod
    def _progress(state, sas_configured):
        return {
            "state": state,
            "sas_configured": sas_configured,
            "bytes_done": 0,
            "bytes_total": 0,
            "bytes_downloaded": 0,
            "files_done": 0,
            "files_total": 0,
            "current_file": None,
            "error": None,
        }
    def _run(self):
        while True:
            outcome = self._sync_outcome(self.url) if self.url else {}
            with self.lock:
                if self.stopping.is_set() or not self.pending:
                    self.progress.update(outcome, current_file=None)
                    self.worker = None
                    return
                self._prepare()

    def _sync_outcome(self, url):
        try:
            self._sync(url)
        except CancelledError:
            return {"state": "idle"}
        except HTTPError as error:
            code = error.code
            error.close()
            if code in (401, 403):
                return {
                    "state": "sas_rejected",
                    "error": {
                        "code": "sas_rejected",
                        "message": "The read SAS was rejected. It may be expired or revoked.",
                    },
                }
            return {
                "state": "error",
                "error": {"code": "download_failed", "message": "Could not download demo assets"},
            }
        except Exception:
            return {
                "state": "error",
                "error": {
                    "code": "sync_failed",
                    "message": "Could not synchronize demo assets. Check the SAS and retry.",
                },
            }
        return {"state": "ready"}

    def _check_running(self):
        if self.stopping.is_set():
            raise CancelledError

    def _sync(self, url):
        parts = azure_blob_url(url)
        base = f"{parts.scheme}://{parts.netloc}/{ASSET_CONTAINER}/{ASSET_PREFIX}/"

        transport = nullcontext(self.opener) if self.opener else BlobRequests(parts.netloc)
        with transport as open_blob:
            def fetch(name):
                self._check_running()
                return open_blob(f"{base}{quote(name)}?{parts.query}")

            self._sync_manifest(fetch)

    def _sync_manifest(self, fetch):
        with fetch("manifest.json") as response:
            manifest = json.load(response)
        entries = manifest_entries(manifest, self.root)
        state_path = self.root / ".verified.json"
        try:
            previous = json.loads(state_path.read_text(encoding="utf-8"))
        except (FileNotFoundError, ValueError):
            previous = {}
        if not isinstance(previous, dict):
            previous = {}

        with self.lock:
            self.progress.update(
                bytes_total=sum(size for size, _ in entries.values()), files_total=len(entries)
            )
        verified = {}
        missing = []
        for name, (size, digest) in entries.items():
            self._check_running()
            identity = verified_file(self.root / name, size, digest, previous.get(name))
            if identity is None:
                missing.append(name)
            else:
                verified[name] = identity
                with self.lock:
                    self.progress["bytes_done"] += size
                    self.progress["files_done"] += 1

        active = {}

        def download(name):
            with self.lock:
                active[name] = None
                self.progress["current_file"] = name
            try:
                identity = download_file(name)
            finally:
                with self.lock:
                    del active[name]
                    self.progress["current_file"] = next(reversed(active), None)
            return name, identity

        def download_file(name):
            size, digest = entries[name]
            path = self.root / name
            hasher = hashlib.sha256()
            received = 0
            with atomic_write(path) as file, fetch(name) as response:
                while chunk := response.read(CHUNK_SIZE):
                    self._check_running()
                    received += len(chunk)
                    if received > size:
                        raise ValueError("Asset exceeds manifest size")
                    file.write(chunk)
                    hasher.update(chunk)
                    with self.lock:
                        self.progress["bytes_done"] += len(chunk)
                        self.progress["bytes_downloaded"] += len(chunk)
                if received != size or hasher.hexdigest() != digest:
                    raise ValueError("Asset did not match manifest")
            with self.lock:
                self.progress["files_done"] += 1
            return fingerprint(path, digest)

        if missing:
            with self.lock:
                self.progress["state"] = "downloading"
            with ThreadPoolExecutor(max_workers=8) as pool:
                downloads = [pool.submit(download, name) for name in missing]
                try:
                    for task in as_completed(downloads):
                        name, identity = task.result()
                        verified[name] = identity
                finally:
                    for task in downloads:
                        task.cancel()

        with atomic_write(state_path) as file:
            file.write(json.dumps(verified).encode("utf-8"))
        with atomic_write(self.root / "manifest.json") as file:
            file.write(json.dumps(manifest).encode("utf-8"))
