# SwissSafeDrive — Agent Instructions

Este repositorio pertenece al proyecto SwissSafeDrive.

Antes de realizar cualquier modificación:

1. Leer `/Users/david/dAvId_AI/AGENTS.md`
2. Leer `PROJECT_RULES.md`
3. Leer `docs/HANDOFF_SwissSafeDrive.md`
4. Leer `docs/DECISIONS_SwissSafeDrive.md` si la tarea implica arquitectura o decisiones de producto
5. Ejecutar:
   `git status --short --branch`
6. Verificar el estado real antes de asumir que una tarea anterior está terminada.

## Regla de escritor único

Un solo agente puede modificar una tarea o conjunto de archivos a la vez.

No permitir modificaciones simultáneas de Codex, Claude y Antigravity sobre los mismos archivos.

## Roles

- ChatGPT: estrategia, arquitectura, planificación, documentación, financiación y coordinación.
- Codex: implementación principal, tests, debugging y hardening.
- Claude: auditoría técnica independiente y revisión crítica.
- Antigravity: integración, UI/UX, validación visual y pruebas locales.
- OpenClaw: orquestación cuando el flujo esté estabilizado.

## Al finalizar

Todo agente que modifique archivos debe actualizar:

`docs/HANDOFF_SwissSafeDrive.md`

Debe registrar:

- trabajo realizado;
- archivos modificados;
- tests ejecutados;
- resultado;
- problemas pendientes;
- siguiente acción recomendada.

## Prohibiciones

Sin autorización explícita de David:

- no `git reset --hard`;
- no `git clean`;
- no borrados destructivos;
- no commit;
- no push;
- no deployment.

La decisión sancionatoria es siempre humana.

SwissSafeDrive no emite multas automáticamente y no participa económicamente de las sanciones.
