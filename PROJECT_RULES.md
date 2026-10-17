# SwissSafeDrive — Project Rules

## Source of truth

Workspace:
`/Users/david/dAvId_AI/SwissSafeDrive`

Global instructions:
`/Users/david/dAvId_AI/AGENTS.md`

Active handoff:
`docs/HANDOFF_SwissSafeDrive.md`

## Agent roles

ChatGPT:
strategy / architecture / planning / documentation / financing / coordination

Codex:
primary implementation / tests / debugging / hardening

Claude:
independent technical audit / critical review

Antigravity:
integration / UI-UX / visual validation / local testing

OpenClaw:
local orchestration when the workflow is sufficiently stable

## Writer policy

One writer at a time.

Never allow Codex, Claude and Antigravity to modify the same files concurrently.

## Startup protocol

Before modifying the project:

1. Read `/Users/david/dAvId_AI/AGENTS.md`
2. Read `PROJECT_RULES.md`
3. Read `docs/HANDOFF_SwissSafeDrive.md`
4. Run:
   `git status --short --branch`
5. Inspect the real current state.
6. Define the scope before modifying files.

Never assume previous work is complete without verification.

## Close protocol

Before ending a development task:

1. Run focused tests.
2. Record test results.
3. Update `docs/HANDOFF_SwissSafeDrive.md`.
4. List modified files.
5. Record unresolved issues.
6. Specify the recommended next action.

## Safety

Never execute without explicit authorization from David:

- `git reset --hard`
- `git clean`
- destructive deletion
- commit
- push
- deployment

Never place secrets, credentials or production police data in the repository.

## SwissSafeDrive principles

- Human decision remains final.
- No automatic fines.
- No revenue share from fines.
- Privacy by Design.
- Data minimization.
- Local / edge processing preferred.
- Cryptographic pseudonymization where applicable.
- A simple public hash must not be described as anonymous.
- Least privilege.
- Auditable access.
- Encryption in transit and at rest.
- Secure-by-default configuration.
- Swiss data sovereignty where required.
- Legal validation before public-road deployment.
- DPIA / privacy review before an institutional pilot when required.
- Do not claim legal approval, certification or compliance until validated by the competent authority.

## Project status language

Always distinguish:

- HECHO / VERIFICADO
- PROPUESTO
- POR VALIDAR

Financial projections, prices and market scenarios remain hypotheses until validated through the first institutional pilot.

## Documentation design

Institutional SwissSafeDrive documents:

- Helvetica
- white / black / red
- very thin red lines
- generous negative space
- Swiss Design / International Typographic Style
- sober institutional tone

Operational language with David: Spanish.

Institutional documents according to recipient:
Italian / German / French / English.
