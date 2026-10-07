# Plan de intervención — Upgrade 3

## Objetivo del plan

Traducir el estado y los eventos observables del dominio a presentación breve, sin que Phaser se convierta en fuente de decisiones o modifique navegación.

## Cambios propuestos

| Paso | Cambio mínimo | Archivos previstos | Verificación | Riesgo | Condición de detención |
|---:|---|---|---|---|---|
| 1 | Definir una tabla exhaustiva `GuardMode -> presentación` | `src/game/presentation/guardPresentation.ts` (nuevo) y pruebas de presentación si se habilita entorno puro | Cobertura de los cinco estados; estado nuevo sin mapeo debe fallar en tipos | Fallback silencioso | No aceptar un estado sin representación identificable |
| 2 | Consumir eventos nuevos de telemetría una sola vez y disparar feedback finito | `src/game/scenes/GameScene.ts` o adaptador de presentación; `tests/application/guardSimulation.test.ts` | Una transición produce un solo efecto; repetición de cuadro no lo duplica | Acoplar tween a la decisión | Detener si la escena empieza a cambiar el estado o la ruta |
| 3 | Probar interrupciones, reinicio y superposición visual con cono/HUD | Pruebas unitarias de mapeo y pasos manuales documentados | Revisar cambios rápidos y escenas reiniciadas | Tween anterior permanece activo | Detener si Phaser conserva referencias tras reinicio |

## Orden de implementación

Separar primero el mapeo visual y su tipado, luego suscribir la escena a transiciones nuevas y finalmente probar reinicios. No se debe reproducir el último evento en cada actualización.

## Fuera de alcance

- Spritesheets, Spine u otros recursos externos.
- Cambiar parámetros de IA para mejorar una animación.
- Cámara dinámica, shake, flash o partículas del Upgrade 4.
