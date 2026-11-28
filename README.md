# Swiss Safe Drive demoSuite

Swiss Safe Drive demonstrates AI-assisted police review, driver monitoring, hazard detection and training data collection.

## Demo 01–05

From the repository root, install the frontend dependencies and start Vite.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite and select a demo.

## Demo 06 — Police Candidate Review

Demo 06 uses a local Python API. Install the frontend dependencies as above, then run these commands from the repository root.

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env.local
```

Set `SSD_SESSION_TOKEN` and `VITE_SSD_SESSION_TOKEN` in `.env.local` to the same random value. Set `DEMO_ASSETS_READ_SAS_URL` to your read SAS URL or leave it blank and use the password field in Demo 06. If the SAS set in `.env.local` expires, update that setting with a new read SAS URL and restart the backend.

Start the backend in the activated environment.

```sh
python backend/backend_runner.py
```

Run `npm run dev` in another terminal and open `/#/demo-06` on the local Vite server. The first launch downloads about 2.1 GB into `.demo-assets/`. Set `SSD_ASSET_CACHE_DIR` in `.env.local` to use a different cache directory.

## Verification

```sh
npm test
npm run lint
npx tsc --noEmit
GITHUB_PAGES=true npm run build
pip install pytest httpx
python -m pytest backend/tests
```
