# Plan de implementación — Upgrade 1

## Objetivo del plan

Añadir una pausa y orientación anticipatoria sólo a la patrulla, preservando las reglas H4 y la separación entre decisión, locomoción y presentación.

## Resultado de implementación

Completado. Se incorporó el temporizador de pausa al estado de patrulla; la aplicación detiene el avance, conserva la ruta al siguiente waypoint y orienta al guardia al primer segmento no recorrido. La pausa se cancela al recibir un estímulo válido.

Archivos modificados: `src/domain/behavior/guardBehavior.ts`, `src/application/simulation/guardSimulation.ts`, `src/game/scenes/GameScene.ts`.
Pruebas: `tests/behavior/guardBehavior.test.ts` y `tests/application/guardSimulation.test.ts`.

## Cambios propuestos

| Paso | Cambio mínimo | Archivos previstos | Verificación | Riesgo | Condición de detención |
|---:|---|---|---|---|---|
| 1 | Añadir fase/temporizador de pausa al estado de patrulla y un evento de llegada | `src/domain/behavior/guardBehavior.ts`; `tests/behavior/guardBehavior.test.ts` | Reloj controlado: pausa no vence antes y sí vence en el límite | Temporizador mezclado con reloj del motor | Detener si el dominio necesita importar Phaser o Date global |
| 2 | Exponer dirección deseada de mirada separada de movimiento | `src/domain/behavior/guardBehavior.ts`; `src/application/simulation/guardSimulation.ts` | La orientación anticipa el siguiente tramo sin desplazar al guardia | Cono de visión cambia durante la pausa | Detener si falta decidir si la mirada es el próximo tramo o patrón alternado |
| 3 | Presentar la pausa y orientación sin decidir conducta en la escena | `src/game/scenes/GameScene.ts` | Comprobación manual de pausa, giro, salida y estímulo prioritario | Desincronización entre animación y estado | Detener si la presentación implica cambiar visión/sonido |

## Orden de implementación

Primero se prueba el temporizador en dominio, luego se propaga la dirección por aplicación y al final se representa en Phaser. El objetivo es que una pausa no altere ni la ruta calculada ni las prioridades de H4.

## Fuera de alcance

- Añadir animaciones o efectos de cámara.
- Pausar otros estados del guardia.
- Cambiar el ángulo o alcance del sensor visual.
