# Evidence for spec #28

Integration commit `e2ea285f5c9161e13524ee22293dce29232f2e62`. Baseline commit `5fe4e8e`.

Every screenshot is from a real run. The baseline uses its Vite dev server, the Pages build uses a static Vite preview, and local checks use the Python backend with Vite. Both download screenshots use the real `demo-assets` container.

Timestamps use Europe/Madrid.

- [vitest.txt](vitest.txt) — 33 tests passed in 8 files. `npm test` · 2026-11-28T16:01:15+01:00
- [lint.txt](lint.txt) — ESLint passed. `npm run lint` · 2026-11-28T16:01:15+01:00
- [tsc.txt](tsc.txt) — TypeScript check passed with empty output. `npx tsc --noEmit` · 2026-11-28T16:01:17+01:00
- [pages-build.txt](pages-build.txt) — Pages production build passed with a bundle-size warning. `GITHUB_PAGES=true npm run build` · 2026-11-28T16:01:29+01:00
- [pytest.txt](pytest.txt) — 46 tests passed with 2 deprecation warnings. `/workspace/demoSuite-main-port/.venv/bin/python -m pytest backend/tests -q` · 2026-11-28T16:01:37+01:00
- [before-landing.png](before-landing.png) — Baseline landing page with the Italian Demo 01 card. `http://127.0.0.1:5176/#/` · 2026-11-28T15:59:15+01:00
- [before-demo01.png](before-demo01.png) — Baseline Demo 01 in Italian. `http://127.0.0.1:5176/#/demo-01` · 2026-11-28T15:59:16+01:00
- [after-landing.png](after-landing.png) — Pages landing page with Run locally on the Demo 06 card. `http://127.0.0.1:5177/demoSuite/#/` · 2026-11-28T16:00:40+01:00
- [pages-run-locally.png](pages-run-locally.png) — Static Pages Demo 06 with local setup instructions. `http://127.0.0.1:5177/demoSuite/#/demo-06` · 2026-11-28T16:00:40+01:00
- [missing-sas.png](missing-sas.png) — Connect demo assets prompt with an empty password field. `http://127.0.0.1:5178/#/demo-06` · 2026-11-28T15:59:14+01:00
- [download-progress.png](download-progress.png) — Live asset download at 5.2 MB with a current file. `http://127.0.0.1:5178/#/demo-06` · 2026-11-28T15:59:18+01:00
- [download-progress-2.png](download-progress-2.png) — Later live download capture at 360.3 MB. `http://127.0.0.1:5178/#/demo-06` · 2026-11-28T15:59:21+01:00
- [after-demo01.png](after-demo01.png) — Integrated Demo 01 in English. `http://127.0.0.1:5178/#/demo-01` · 2026-11-28T16:00:44+01:00
- [candidate-list.png](candidate-list.png) — Three Candidates with SIMULATED SIGNAL tags. `http://127.0.0.1:5178/#/demo-06` · 2026-11-28T16:00:47+01:00
- [case-player-overlay.png](case-player-overlay.png) — Cba052-028 paused at the bridge with boxes, plate blur, v5 windshield crop, and timeline. `http://127.0.0.1:5178/#/demo-06` · 2026-11-28T16:00:48+01:00
- [timeline-seek.png](timeline-seek.png) — Phone-in-hand stretch start with the updated playhead and windshield crop. `http://127.0.0.1:5178/#/demo-06` · 2026-11-28T16:00:48+01:00
- [case-analysis-summary.png](case-analysis-summary.png) — Saved Mark for review decision and observation summary. `http://127.0.0.1:5178/#/demo-06` · 2026-11-28T16:00:49+01:00
- [case-other-car.png](case-other-car.png) — Cba052-051 opened by clicking its box, with the windshield marked Not assessable. `http://127.0.0.1:5178/#/demo-06` · 2026-11-28T16:00:50+01:00
- [candidate-list-flagged.png](candidate-list-flagged.png) — Candidate list with Cba052-051 added as Flagged manually. `http://127.0.0.1:5178/#/demo-06` · 2026-11-28T16:00:50+01:00
