# HANDOFF — SwissSafeDrive

## Estado actual

HECHO / VERIFICADO

- Proyecto ChatGPT SwissSafeDrive creado.
- Workspace local creado en:
  `/Users/david/dAvId_AI/SwissSafeDrive`
- Dossier institucional desarrollado.
- Material para reunión con Fondazione AGIRE preparado.
- Marca de trabajo: SwissSafeDrive.
- Fundadores: David Induni y José Francisco Codino.
- Primera reunión con Fondazione AGIRE prevista.
- Estrategia inicial: obtener una primera carta de interés institucional y preparar un piloto.

## Principios ya decididos

- SwissSafeDrive no emite multas automáticamente.
- La decisión sancionatoria corresponde siempre a la autoridad policial.
- SwissSafeDrive no recibe porcentaje de las multas.
- Privacy by Design desde la arquitectura.
- Procesamiento local / edge preferido.
- Pseudonimización criptográfica cuando corresponda.
- Acceso restringido, cifrado y trazabilidad.
- Deployment on-premise preferido cuando sea viable.
- SUPSI / DTI / IDSIA / ISIN son colaboradores potenciales, no confirmados.

## POR VALIDAR

- Primera autoridad pública interesada.
- Arquitectura definitiva del piloto.
- Marco jurídico del primer cantón/comuna.
- DPIA y roles de tratamiento.
- Necesidad concreta de METAS u otra homologación.
- Pricing real.
- Costes reales de hardware, instalación y soporte.
- Vía de financiación prioritaria.
- Participación eventual de SUPSI.

## Próximo objetivo

Reunión con Fondazione AGIRE:

1. Presentar SwissSafeDrive.
2. Validar roadmap empresarial.
3. Identificar vías de financiación.
4. Identificar contactos institucionales para un primer piloto.
5. Evaluar colaboración SUPSI / Innosuisse.
6. Definir siguiente milestone concreta.

## Regla de continuidad

Todo agente que modifique SwissSafeDrive debe actualizar este archivo antes de finalizar.

---

## Cierre de sesión — 17/10/2026

### HECHO / VERIFICADO

- Workspace independiente creado en:
  `/Users/david/dAvId_AI/SwissSafeDrive`
- Repositorio Git independiente inicializado en rama `main`.
- SwissSafeDrive excluido del repositorio Git padre `/Users/david/dAvId_AI`.
- Estructura documental base creada.
- `PROJECT_RULES.md` creado.
- `AGENTS.md` creado.
- `CLAUDE.md` creado.
- Instrucciones específicas para Antigravity y OpenClaw creadas en `.agents/`.
- Roadmap, decisiones y handoff iniciales creados.
- Primer commit base realizado.

### Roles acordados

- ChatGPT: dirección estratégica, arquitectura, documentación y coordinación.
- Codex: implementación principal.
- Claude: auditoría técnica independiente.
- Antigravity: integración, UI/UX y validación local.
- OpenClaw: futura capa de orquestación cuando el flujo esté estabilizado.

### Próximo paso recomendado

En la próxima sesión:

1. Leer `AGENTS.md`.
2. Leer `PROJECT_RULES.md`.
3. Leer este handoff.
4. Ejecutar `git status --short --branch`.
5. Revisar el resultado de la reunión con Fondazione AGIRE.
6. Definir el primer bloque real de desarrollo o documentación institucional.

No instalar ni configurar agentes adicionales hasta decidir qué parte debe asumir dAvIdOS/OpenClaw y evitar duplicar funciones de orquestación.

---

## Cierre de sesión — 19/10/2026 (Antigravity — FINAL FIX PASS)

### Agente responsable
- Antigravity (ÚNICO WRITER)

### Trabajo realizado (HECHO / VERIFICADO)
1. **Sincronización no destructiva al repositorio oficial (`/Users/david/dAvId_AI/SwissSafeDrive`):**
   - Copiados `app/` y `backend/` desde la copia de lectura en Desktop excluyendo artefactos (`node_modules`, `target`, `venv`, `__pycache__`, `*.db`, `capturas`, `build`, `dist`).
2. **Blocker 1 — Camera in diretta (`app/src/pages/CamaraEnVivo.jsx`):**
   - Solicita acceso a cámara real mediante `navigator.mediaDevices.getUserMedia` al abrir la vista o pulsar activación.
   - Si no hay cámara conectada o falla `getUserMedia`, activa automáticamente `MODALITÀ DEMO — NESSUNA CAMERA COLLEGATA` sin mostrar errores técnicos rojos ni simular un vídeo falso, permitiendo volver a `Registri`.
3. **Blocker 2 — Permiso nativo de cámara en macOS (`app/src-tauri/Info.plist`):**
   - Añadido `NSCameraUsageDescription` en `app/src-tauri/Info.plist` e integrado en el `Contents/Info.plist` final del bundle `.app`.
4. **Blocker 3 — Wording de privacidad y legalidad:**
   - Eliminadas todas las menciones a `"Conformità LPD"`, `"indizio tecnico anonimizzato"` y `"Datos anonimizados conforme LPD"` en código fuente y build (`app/src/pages/Dashboard.jsx`, `app/src/data/registros-mock.js`, `app/src/App.jsx`, `backend/models.py`, `backend/backend_runner.py`).
   - Estandarizado el texto aprobado: `"Privacy by Design"`, `"Dati minimizzati e pseudonimizzati ove applicabile"` y `"Demo non destinata a uso operativo"`.
5. **Blocker 4 y 5 — Limpieza de rutas/identificadores y empaquetado final (`v0.2.1`):**
   - Cambiado bundle identifier a `ch.swisssafedrive.demo` y versión a `0.2.1`.
   - Eliminada la referencia visible a `backend/capturas/` en la interfaz.
   - Mejorado el ciclo de vida del proceso backend en `app/src-tauri/src/lib.rs` (envío de `SIGTERM` al cerrar/reiniciar para liberar limpiamente el puerto `8765`).
   - Compilado binario standalone `swisssafedrive-backend-aarch64` con PyInstaller (`--onefile --strip --clean`) desde el repositorio oficial y empaquetado en Tauri release (`strip = true`, `--remap-path-prefix`).
   - Generados y copiados `.app` y `.dmg` finales en `/Users/david/Desktop/SwissSafeDrive_Demo_FINAL/`:
     - `/Users/david/Desktop/SwissSafeDrive_Demo_FINAL/SwissSafeDrive.app`
     - `/Users/david/Desktop/SwissSafeDrive_Demo_FINAL/SwissSafeDrive_0.2.1_aarch64.dmg`

### Archivos modificados / creados en `/Users/david/dAvId_AI/SwissSafeDrive`
- `app/package.json`
- `app/src/App.jsx`
- `app/src/api/client.js`
- `app/src/data/registros-mock.js`
- `app/src/pages/CamaraEnVivo.jsx`
- `app/src/pages/Dashboard.jsx`
- `app/src/pages/RegistroDetalle.jsx`
- `app/src-tauri/Cargo.toml`
- `app/src-tauri/Info.plist`
- `app/src-tauri/tauri.conf.json`
- `app/src-tauri/src/lib.rs`
- `backend/backend_runner.py`
- `backend/database.py`
- `backend/main.py`
- `backend/models.py`
- `backend/schemas.py`
- `docs/HANDOFF_SwissSafeDrive.md`

### Tests ejecutados y resultado
- `npm run build` (Vite production build): **PASS**
- `PyInstaller --onefile --strip --clean` (`swisssafedrive-backend-aarch64` arm64): **PASS**
- `npm run tauri build` (`.app` y `.dmg` aarch64 release): **PASS**
- Apertura de `/Users/david/Desktop/SwissSafeDrive_Demo_FINAL/SwissSafeDrive.app` con `open` (equivalente a doble clic) y autoarranque del backend en `127.0.0.1:8765`: **PASS**
- Verificación de endpoints `GET /`, `GET /api/registros`, `GET /api/registros/{id}`, `PATCH /api/registros/{id}/decision`, `GET /api/estadisticas`: **PASS**
- Verificación de cierre de la app, liberación del puerto `8765` y reapertura limpia: **PASS**
- Verificación de `NSCameraUsageDescription` y `CFBundleIdentifier = ch.swisssafedrive.demo` en `Contents/Info.plist`: **PASS**
- Auditoría de textos y strings en fuente y binarios (sin `"Conformità LPD"`, sin `"anonimizzati conforme LPD"`, sin `backend/capturas/`, sin dependencia de `/Users/david/Desktop/SwissSafeDrive`): **PASS**

### Problemas pendientes
- Ninguno para la demo institucional local (`v0.2.1`).

### Siguiente acción recomendada
- Utilizar `/Users/david/Desktop/SwissSafeDrive_Demo_FINAL/SwissSafeDrive.app` o `/Users/david/Desktop/SwissSafeDrive_Demo_FINAL/SwissSafeDrive_0.2.1_aarch64.dmg` para la demostración institucional.

---

## Cierre de sesión — 19/10/2026 (Antigravity — FINAL HARDENING PASS 0.2.2)

### Agente responsable
- Antigravity (ÚNICO WRITER)

### Trabajo realizado (HECHO / VERIFICADO)
1. **Firma y portabilidad macOS (`v0.2.2`):**
   - Ejecutado `security find-identity -v -p codesigning` (`0 valid identities found`).
   - Firmado en orden correcto: primero el binario embebido `Contents/Resources/resources/swisssafedrive-backend-aarch64` y después `SwissSafeDrive.app` (`codesign --force --deep --sign -`), sellando `Contents/_CodeSignature/CodeResources`.
   - Verificado con `codesign --verify --deep --strict --verbose=2` tanto en `/Users/david/Desktop/SwissSafeDrive_Demo_FINAL/SwissSafeDrive.app` como en el `.app` montado desde `/Users/david/Desktop/SwissSafeDrive_Demo_FINAL/SwissSafeDrive_0.2.2_aarch64.dmg`.
   - *Nota explícita:* Al no existir certificado `Developer ID Application` en el llavero local, la firma es ad-hoc válida para ejecución local en Apple Silicon (M1/M2); la distribución externa requerirá certificado `Developer ID Application` + notarización Apple.
2. **Autenticación de sesión API local, límites de subida, CORS y CSP:**
   - Rust/Tauri (`app/src-tauri/src/lib.rs`) genera un token criptográficamente aleatorio de 256 bits (`/dev/urandom`, 64 hex chars) en cada arranque, lo pasa al backend por `SSD_SESSION_TOKEN` y lo expone únicamente al frontend mediante comandos Tauri internos (`get_backend_config` / `get_session_token`).
   - El frontend (`app/src/api/client.js`, `app/src/pages/RegistroDetalle.jsx`) adjunta `X-SSD-Session: <token>` en todas las peticiones API e imágenes.
   - El backend (`backend/main.py`) valida `X-SSD-Session` con `secrets.compare_digest` y rechaza con `401 Unauthorized` cualquier petición a `/api/*` sin token válido.
   - `POST /api/capturas/upload` exige `X-SSD-Session`, limita tamaño a 5 MB (`413`), valida MIME (`image/jpeg`, `image/png`, `image/webp`) y magic bytes (`415`), limita el número de capturas temporales en `Application Support` y las limpia automáticamente al cerrar.
   - CORS restringido sin comodines (`*`) a los orígenes de Tauri/dev y cabeceras `Content-Type`, `X-SSD-Session`.
   - CSP configurada en `app/src-tauri/tauri.conf.json` (eliminado `csp: null`).
3. **Privacidad, pseudonimización e identidad institucional:**
   - Eliminado el concepto `placa_hash` y sustituido por `identificatore_demo` (`Identificatore tecnico demo`).
   - Eliminadas afirmaciones de pseudonimización/anonimización en la demo; estandarizado: `"Privacy by Design — demo non destinata a uso operativo"`, `"Dati minimizzati nel contesto della dimostrazione"`, y documentado que el cifrado y retención productivos están **POR VALIDAR**.
   - `NSCameraUsageDescription` actualizado a: `"SwissSafeDrive utilizza la fotocamera esclusivamente per la dimostrazione locale della funzione Camera in diretta."`
   - Eliminado `"Polizia Città di Lugano"` de la cabecera y sustituido por `"SwissSafeDrive — Demo istituzionale"`.
   - Reforzada la indicación explícita de que la decisión sancionatoria corresponde siempre al operador humano.
4. **Gestión de proceso hijo y puerto / Reproducibilidad Git:**
   - Eliminado todo uso de `pkill -f swisssafedrive-backend-aarch64`.
   - `lib.rs` conserva únicamente su propio `Child` handle/grupo de proceso y `backend_runner.py` supervisa `SSD_PARENT_PID` para terminar exclusivamente el proceso hijo propio al cerrarse la app.
   - Comprobación previa de puertos controlados (`8765..=8770`) sin matar procesos externos.
   - Actualizado `.gitignore` y creado script reproducible `scripts/build_release.sh`.

### Archivos modificados / creados en `/Users/david/dAvId_AI/SwissSafeDrive`
- `.gitignore`
- `scripts/build_release.sh`
- `app/package.json`
- `app/src/App.jsx`
- `app/src/api/client.js`
- `app/src/data/registros-mock.js`
- `app/src/pages/CamaraEnVivo.jsx`
- `app/src/pages/Dashboard.jsx`
- `app/src/pages/RegistroDetalle.jsx`
- `app/src-tauri/Cargo.toml`
- `app/src-tauri/Info.plist`
- `app/src-tauri/tauri.conf.json`
- `app/src-tauri/resources/.gitkeep`
- `app/src-tauri/src/lib.rs`
- `backend/backend_runner.py`
- `backend/main.py`
- `backend/models.py`
- `backend/schemas.py`
- `backend/seed.py`
- `docs/HANDOFF_SwissSafeDrive.md`

### Tests ejecutados y resultado
- `scripts/build_release.sh` (`npm run build`, PyInstaller standalone arm64, `npm run tauri build`, codesign + DMG): **PASS**
- `codesign --verify --deep --strict --verbose=2` en `.app` final y en `.app` dentro del `.dmg`: **PASS**
- Peticiones `/api/*` sin token o con token inválido => `401 Unauthorized`: **PASS**
- Peticiones `/api/*` con `X-SSD-Session` válido (`GET /api/registros`, `GET /api/registros/1`, `PATCH /api/registros/1/decision`, validación `415` en upload): **PASS**
- Cierre de `.app` termina únicamente su proceso hijo y libera el puerto `8765`; reapertura genera nuevo token aleatorio: **PASS**

### Problemas pendientes (POR VALIDAR)
- Cifrado en reposo/tránsito y políticas de retención productivas: **POR VALIDAR** para piloto institucional.
- Distribución externa fuera de equipos locales de demo requerirá certificado `Developer ID Application` + notarización Apple.

### Siguiente acción recomendada
- Utilizar `/Users/david/Desktop/SwissSafeDrive_Demo_FINAL/SwissSafeDrive.app` o `/Users/david/Desktop/SwissSafeDrive_Demo_FINAL/SwissSafeDrive_0.2.2_aarch64.dmg` para la demostración institucional.

---

## DemoSuite ticket #21

- Exported 131 Passes with saved vehicle geometry, bridge Snapshots and three labelled simulated Candidates. Added local footage lookup, protected Pass routes, English record routes and a Vite browser session token.
- Updated `app/README.md`, `app/src/api/client.js`, `app/src/pages/{CamaraEnVivo,Dashboard,RegistroDetalle}.jsx` and `app/src/pages/recordStateLabels.js`. Backend changes cover `backend/{main,models,schemas,backend_runner,seed,pass_fixture}.py`, `backend/fixtures/` and `backend/tests/`. Added `scripts/build_pass_fixture.py` and `scripts/locate_footage.py`.
- `python -m pytest backend/tests` passed all 11 tests. The Vite production build passed. Headless Chrome loaded the registry against the local runner and saved a decision on a migrated 0.2.2 record. Capture upload, image retrieval and all three local clip lookups passed.
- The fixture uses bridge frames 927 and 1051 for the second and third Candidates because the tracker-selected frames occur after the v5 windshield leaves view. The fixture README records the source frames and substitution.
- Next action for the orchestrator is to integrate the signed ticket branch before starting the recorded-video player and crop batch. No outstanding ticket #21 implementation work.

## DemoSuite ticket #20

- Added native recorded playback, a clip chooser in the simulated case detail, frame-synced vehicle and windshield overlays, labelled simulated confidence, and a lower-front pixel blur for tracked vehicles. Local playback uses clip-scoped signed URLs and byte ranges.
- Updated `app/src/{App.jsx,api/client.js,styles.css,pages/CaseDetail.jsx,pages/CamaraEnVivo.jsx,media/RecordedPlayer.jsx,media/videoOverlay.js}` and `app/src-tauri/tauri.conf.json`. Renamed `RegistroDetalle.jsx` to `CaseDetail.jsx`. Updated `backend/{main,clip_routes,footage,overlay}.py`, `backend/tests/test_overlay.py`, and `scripts/locate_footage.py`.
- The full backend suite passed all 14 tests. The Vite build passed. Real headless Chrome playback and seek passed for all three clips at two viewport sizes, with overlay alignment and changed pixels in the plate regions. The local API passed signed URL, HEAD and byte-range checks.
- Open verification is the packaged WebView. The clip chooser is independent of the legacy records, and the blur uses only vehicles with saved fixture geometry.
- Next action for the orchestrator is to take the ticket through review and verify native playback and visible plate blur in the macOS WebView during the Evidence stage.

---

## DemoSuite ticket #22

- Added a local batch that blurs tracked plates before warping fixture windshield quads with the locked pad. It publishes a time-indexed JPEG strip or a Not assessable status for each Pass. Restored the slim tracker environment at `/workspace/wt/venv`.
- Added the session-protected crop metadata and JPEG routes. Changed `.gitignore`, `backend/main.py`, `backend/fixtures/README.md` and this handoff. Added `backend/crop_storage.py`, `backend/crop_routes.py`, `backend/tests/test_crops_api.py` and `scripts/precompute_windshield_crops.py`.
- `/workspace/demoSuite-26/ticket-21/.venv/bin/python -m pytest backend/tests` passed all 15 tests, including real bridge-frame fetches, geometry and unavailable crops. Starlette reported one dependency deprecation warning.
- Verified 8,890 local JPEGs for 93 Passes and Not assessable entries for 38 Passes in `/workspace/demo-map/windshield-crops/`. All 131 metadata requests and the three Candidate bridge image requests passed. No ticket implementation issues remain.
- Next action for the orchestrator is to integrate the signed ticket branch and use the crop routes for the side panel in #23.

## DemoSuite ticket #24

- Reused the registry layout for the English Candidate list and translated the review console shell and live-camera page. The list uses bridge decisions or manual flags, shows labelled simulated scores, and opens the selected vehicle at its bridge frame.
- Added an API route that opens a stable review Record for a Pass. The existing decision route saves the operator's review state and the list reflects it on return.
- Changed `app/src/{App.jsx,api/client.js,media/RecordedPlayer.jsx,media/videoOverlay.js,pages/CaseDetail.jsx,pages/Dashboard.jsx,pages/recordStateLabels.js,styles.css}`, renamed `CamaraEnVivo.jsx` to `LiveCamera.jsx`, and changed `backend/{main,schemas,candidate_membership}.py`, `backend/tests/test_membership.py` and this handoff.
- The full backend suite passed 23 tests with one Starlette deprecation warning. The Vite build passed. Real Chrome showed three Candidates and opened Cba002-068 at 48.12 seconds. All three review decisions persisted. Evidence is in `~/agent-notes/demoSuite-26/evidence/ticket-24-*.png`.
- The manual-flag API stores flags for the current backend process. During integration, use #23's durable flag source for membership and connect its open-Pass action to the same case entry point.
