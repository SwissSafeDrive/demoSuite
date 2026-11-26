import importlib
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    with pytest.MonkeyPatch.context() as patch:
        patch.syspath_prepend(str(Path(__file__).resolve().parents[1]))
        patch.setenv("SSD_DATA_DIR", str(tmp_path_factory.mktemp("demo")))
        patch.setenv("SSD_SESSION_TOKEN", "test-session")
        modules = ("backend_runner", "main", "database", "models", "schemas")
        for name in modules:
            patch.delitem(sys.modules, name, raising=False)
        runner = importlib.import_module("backend_runner")
        try:
            runner.seed_demo_data()
            with TestClient(runner.main.app) as client:
                yield client
        finally:
            sys.modules["database"].engine.dispose()
            for name in modules:
                sys.modules.pop(name, None)
