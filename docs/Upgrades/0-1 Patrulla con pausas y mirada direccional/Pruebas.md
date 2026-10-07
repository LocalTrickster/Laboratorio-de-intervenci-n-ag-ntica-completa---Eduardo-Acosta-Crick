# Evidencia de pruebas — Upgrade 1

Estado: implementado y validado. Duración configurada: 700 ms.

| Criterio | Prueba automatizada | Resultado |
|---|---|---|
| Llega al waypoint, pausa, mantiene posición y mira al siguiente tramo | `tests/application/guardSimulation.test.ts`: pausa sin movimiento y orientación de ruta | Aprobado |
| Reanuda al vencer el plazo y registra la transición | `tests/behavior/guardBehavior.test.ts`: reloj controlado | Aprobado |
| Visión cancela pausa; visión gana a sonido | `tests/behavior/guardBehavior.test.ts`: interrupción y prioridad | Aprobado |
| Validación completa | `npm run validate` | Typecheck y build aprobados; 67 pruebas en 10 archivos |

## Comprobación manual

La escena local se abrió en navegador. Al llegar a un punto se observaron las pausas cíclicas y en HUD los eventos de llegada y fin de pausa. No se guardó captura como archivo; si la plataforma exige un adjunto, tomar una captura de la escena antes de enviar.

## Límite

La orientación y temporización están cubiertas por simulación automatizada y la escena se probó localmente; no hay prueba automatizada de fotogramas Phaser.
