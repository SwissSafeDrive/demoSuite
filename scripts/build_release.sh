#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
APP_DIR="$REPO_ROOT/app"
RESOURCES_DIR="$APP_DIR/src-tauri/resources"
FINAL_OUT_DIR="/Users/david/Desktop/SwissSafeDrive_Demo_FINAL"

echo "=== [1/5] Building standalone Python backend (arm64) ==="
mkdir -p "$RESOURCES_DIR"
PYTHON_BIN="${PYTHON_BIN:-$BACKEND_DIR/.venv/bin/python}"
if [ ! -x "$PYTHON_BIN" ]; then
  python3 -m venv "$BACKEND_DIR/.venv"
  "$BACKEND_DIR/.venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt" pyinstaller python-multipart
  PYTHON_BIN="$BACKEND_DIR/.venv/bin/python"
fi

"$PYTHON_BIN" -m PyInstaller \
  --onefile \
  --clean \
  --strip \
  --name swisssafedrive-backend-aarch64 \
  --distpath "$RESOURCES_DIR" \
  --workpath "$BACKEND_DIR/build" \
  --specpath "$BACKEND_DIR/build" \
  --hidden-import uvicorn.logging \
  --hidden-import uvicorn.loops \
  --hidden-import uvicorn.loops.auto \
  --hidden-import uvicorn.protocols \
  --hidden-import uvicorn.protocols.http \
  --hidden-import uvicorn.protocols.http.auto \
  --hidden-import uvicorn.protocols.websockets \
  --hidden-import uvicorn.protocols.websockets.auto \
  --hidden-import uvicorn.lifespan \
  --hidden-import uvicorn.lifespan.on \
  --hidden-import multipart \
  --hidden-import python_multipart \
  "$BACKEND_DIR/backend_runner.py"

echo "=== [2/5] Signing embedded backend binary ==="
SIGN_ID=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -n 1 | awk -F'"' '{print $2}' || true)
if [ -n "$SIGN_ID" ]; then
  echo "Using Developer ID Application: $SIGN_ID"
  codesign --force --options runtime --timestamp --sign "$SIGN_ID" "$RESOURCES_DIR/swisssafedrive-backend-aarch64"
else
  echo "No Developer ID Application found; applying local ad-hoc signature to backend"
  codesign --force --sign - "$RESOURCES_DIR/swisssafedrive-backend-aarch64"
fi

echo "=== [3/5] Building frontend and Tauri release bundle ==="
cd "$APP_DIR"
npm run build
RUSTFLAGS="--remap-path-prefix=/Users/david/=/ --remap-path-prefix=$HOME/=/" npm run tauri build -- --bundles app

BUILT_APP="$APP_DIR/src-tauri/target/release/bundle/macos/SwissSafeDrive.app"

echo "=== [4/5] Signing and verifying SwissSafeDrive.app ==="
if [ -n "$SIGN_ID" ]; then
  codesign --force --options runtime --timestamp --sign "$SIGN_ID" "$BUILT_APP/Contents/Resources/resources/swisssafedrive-backend-aarch64"
  codesign --force --deep --options runtime --timestamp --sign "$SIGN_ID" "$BUILT_APP"
else
  codesign --force --sign - "$BUILT_APP/Contents/Resources/resources/swisssafedrive-backend-aarch64"
  codesign --force --deep --sign - "$BUILT_APP"
fi

codesign --verify --deep --strict --verbose=2 "$BUILT_APP"

echo "=== [5/5] Packaging final .app and .dmg into $FINAL_OUT_DIR ==="
mkdir -p "$FINAL_OUT_DIR"
rm -rf "$FINAL_OUT_DIR/SwissSafeDrive.app" "$FINAL_OUT_DIR/SwissSafeDrive_0.2.2_aarch64.dmg"
cp -R "$BUILT_APP" "$FINAL_OUT_DIR/SwissSafeDrive.app"
codesign --verify --deep --strict --verbose=2 "$FINAL_OUT_DIR/SwissSafeDrive.app"

DMG_STAGE=$(mktemp -d)
cp -R "$FINAL_OUT_DIR/SwissSafeDrive.app" "$DMG_STAGE/SwissSafeDrive.app"
ln -s /Applications "$DMG_STAGE/Applications"
hdiutil create -volname "SwissSafeDrive" -srcfolder "$DMG_STAGE" -ov -format UDZO "$FINAL_OUT_DIR/SwissSafeDrive_0.2.2_aarch64.dmg"
rm -rf "$DMG_STAGE"

echo "=== Build 0.2.2 complete ==="
