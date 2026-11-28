import os
import secrets
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, Request
from starlette.concurrency import run_in_threadpool

from .asset_paths import asset_cache_directory
from .asset_sync import AssetSync
from .candidate_membership import candidate_row
from .clip_routes import create_clip_router
from .config import load_settings
from .crop_routes import router as crop_router
from .pass_fixture import load_passes
from .schemas import DecisionIn, DecisionOut, ManualFlagIn


def create_app(*, asset_opener=None):
    settings = load_settings()
    assets = AssetSync(asset_cache_directory(settings), settings, asset_opener)

    @asynccontextmanager
    async def lifespan(_app):
        assets.start()
        try:
            yield
        finally:
            await run_in_threadpool(assets.stop)

    app = FastAPI(title="SwissSafeDrive Demo API", lifespan=lifespan)
    app.state.asset_cache = assets.root

    session_token = settings.get("SSD_SESSION_TOKEN", "").encode()
    manual_flags: dict[str, bool] = {}
    decisions: dict[str, DecisionOut] = {}

    def verify_session_token(x_ssd_session: str | None = Header(default=None, alias="X-SSD-Session")):
        if not session_token or not x_ssd_session or not secrets.compare_digest(
            x_ssd_session.encode(), session_token
        ):
            raise HTTPException(401, "Unauthorized session")

    api = APIRouter(prefix="/api", dependencies=[Depends(verify_session_token)])

    @api.get("/assets/status")
    def asset_status():
        return assets.status()

    @api.post("/assets/sas", status_code=202)
    async def paste_sas(request: Request):
        if settings.get("DEMO_ASSETS_READ_SAS_URL"):
            raise HTTPException(
                409,
                "The read SAS is set in the environment (.env.local). "
                "Update DEMO_ASSETS_READ_SAS_URL there and restart the backend.",
            )
        try:
            body = await request.json()
            if not isinstance(body, dict) or not isinstance(body.get("url"), str):
                raise ValueError
            await run_in_threadpool(assets.paste, body["url"])
        except (ValueError, RecursionError):
            raise HTTPException(400, "Enter a valid HTTPS Azure Blob read SAS URL") from None
        except OSError:
            raise HTTPException(500, "Could not save the read SAS") from None
        return {"ok": True}

    @api.post("/assets/retry", status_code=202)
    def retry_assets():
        assets.start()
        return {"ok": True}

    def require_pass(pass_id):
        record = load_passes().get(pass_id)
        if record is None:
            raise HTTPException(404, "Pass not found")
        return record

    def with_manual_flag(record):
        return {
            **record,
            "flagged_manually": manual_flags.get(record["passId"], record["flagged_manually"]),
        }

    @api.get("/passes")
    def list_passes(clip: str | None = None, track_id: int | None = None):
        return [
            with_manual_flag(record)
            for record in load_passes().values()
            if (clip is None or record["clip"]["id"] == clip)
            and (track_id is None or track_id in record["track_ids"])
        ]

    @api.get("/passes/{pass_id}")
    def get_pass(pass_id: str):
        record = with_manual_flag(require_pass(pass_id))
        decision = decisions.get(pass_id) or DecisionOut(passId=pass_id, state="pending")
        return {**record, **decision.model_dump(mode="json")}

    @api.patch("/passes/{pass_id}/decision")
    def update_decision(pass_id: str, body: DecisionIn) -> DecisionOut:
        require_pass(pass_id)
        decision = DecisionOut(passId=pass_id, decision_at=datetime.now(UTC), **body.model_dump())
        decisions[pass_id] = decision
        return decision

    @api.patch("/passes/{pass_id}/flag")
    def update_pass_flag(pass_id: str, flag: ManualFlagIn):
        require_pass(pass_id)
        manual_flags[pass_id] = flag.flagged_manually
        return {"passId": pass_id, "flagged_manually": flag.flagged_manually}

    @api.get("/candidates")
    def list_candidates():
        rows = []
        for pass_id, record in load_passes().items():
            row = candidate_row(with_manual_flag(record))
            if row is not None:
                decision = decisions.get(pass_id)
                rows.append({**row, "state": decision.state if decision else "pending"})
        return rows

    @app.get("/api/health")
    def health():
        return {"ok": True}

    def require_ready_assets(override_key):
        if not os.environ.get(override_key) and assets.status()["state"] != "ready":
            raise HTTPException(503, "Demo assets are not ready")

    def require_crops():
        require_ready_assets("SSD_CROP_DIR")

    app.include_router(api)
    app.include_router(
        crop_router, dependencies=[Depends(verify_session_token), Depends(require_crops)]
    )
    app.include_router(
        create_clip_router(
            verify_session_token, assets.root, lambda: require_ready_assets("SSD_FOOTAGE_DIR")
        )
    )
    return app


app = create_app()
