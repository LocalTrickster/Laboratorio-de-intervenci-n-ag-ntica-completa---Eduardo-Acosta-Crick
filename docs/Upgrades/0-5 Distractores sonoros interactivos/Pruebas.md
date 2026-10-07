# Evidencia de pruebas — Upgrade 7

Estado: implementado y validado.

| Criterio | Prueba automatizada | Resultado |
|---|---|---|
| El distractor más cercano dentro del rango emite desde el dispositivo | `tests/application/soundDistractor.test.ts` | Aprobado |
| Fuera de alcance o sin dispositivos no crea evento | `tests/application/soundDistractor.test.ts` | Aprobado |
| Ubicaciones configuradas transitables | `tests/model/grid.test.ts` | Aprobado |
| Evento temporal, audición y memoria con objetivo oculto | `tests/application/perceptionSimulation.test.ts` | Aprobado |
| Validación completa | `npm run validate` | Typecheck y build aprobados; 67 pruebas en 10 archivos |

## Comprobación manual y límites

En navegador local se movió al jugador cerca de un distractor y se pulsó E; el guardia reorientó la ruta y la telemetría registró fuente de memoria `sound`. Q continúa emitiendo desde la ubicación del jugador. No se añadieron audio, cooldowns ni límite de usos; no se guardó captura como archivo.
