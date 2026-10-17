# DECISIONS — SwissSafeDrive

Registro de decisiones estratégicas y técnicas.

---

## DEC-001 — Decisión sancionatoria humana

Estado: APROBADO

SwissSafeDrive puede detectar y priorizar eventos, pero nunca decide automáticamente una sanción.

La decisión corresponde exclusivamente a la autoridad policial.

---

## DEC-002 — Sin revenue share de multas

Estado: APROBADO

SwissSafeDrive no participa económicamente de las sanciones ni cobra porcentajes sobre multas.

---

## DEC-003 — Privacy by Design

Estado: APROBADO

La privacidad debe formar parte de la arquitectura desde el inicio:

- minimización;
- procesamiento local;
- control de accesos;
- cifrado;
- trazabilidad;
- retención limitada;
- separación entre detección e identificación.

---

## DEC-004 — Matrículas

Estado: APROBADO

No describir un hash simple de matrícula como anonimización.

Cuando corresponda, utilizar pseudonimización criptográfica con clave/secreto y controles de acceso.

---

## DEC-005 — Deployment

Estado: PREFERENCIA ACTUAL

Preferir despliegue on-premise / edge bajo control de la autoridad cuando sea técnicamente viable.

---

## DEC-006 — SUPSI

Estado: POR VALIDAR

SUPSI / DTI / IDSIA / ISIN se consideran posibles colaboradores técnico-científicos.

No presentarlos como socios confirmados sin acuerdo formal.

---

## DEC-007 — Sociedad

Estado: PROPUESTO

Preparar la estructura societaria y formalizarla en relación con la primera carta de interés institucional y las necesidades del piloto.

---

## DEC-008 — Modelo de agentes

Estado: APROBADO

- ChatGPT: dirección.
- Codex: implementación.
- Claude: auditoría.
- Antigravity: integración/UI/validación.
- OpenClaw: orquestación cuando el flujo sea estable.

Un único escritor por tarea.
