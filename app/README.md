# Tauri + React

This template should help get you started developing with Tauri and React in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Local browser session

Set a temporary session token and use the same value for the backend
`SSD_SESSION_TOKEN` and the Vite dev client `VITE_SSD_SESSION_TOKEN`.
From the repository root, with the backend requirements installed:

```sh
export SSD_SESSION_TOKEN="$(python -c 'import secrets; print(secrets.token_hex(32))')"
python backend/backend_runner.py &
(cd app && VITE_SSD_SESSION_TOKEN="$SSD_SESSION_TOKEN" npm run dev)
```

Open the loopback URL printed by Vite. For backend tests, install `pytest` and
`httpx2` alongside `backend/requirements.txt` and run
`python -m pytest backend/tests` from the repository root.
