# Evidencia de pruebas — Upgrade 6

Estado: implementado y validado.

| Criterio | Prueba automatizada | Resultado |
|---|---|---|
| Cobertura y distractores configurados en celdas transitables | `tests/model/grid.test.ts` | Aprobado |
| Ocultamiento evita visión válida y no actualiza memoria visual | `tests/perception/perception.test.ts`, `tests/application/perceptionSimulation.test.ts` | Aprobado |
| Un sonido sigue actualizando memoria si el jugador está oculto | `tests/application/perceptionSimulation.test.ts` | Aprobado |
| Validación completa | `npm run validate` | Typecheck y build aprobados; 67 pruebas en 10 archivos |

## Comprobación manual y límites

En navegador local se movió al jugador a cobertura y se pulsó H; el HUD indicó `vision OCULTO` y `OCULTO EN COBERTURA`. No se ejecutó manualmente toda la secuencia perseguir → cubrirse → buscar → volver a exponerse. No hay prueba de navegador automatizada.
