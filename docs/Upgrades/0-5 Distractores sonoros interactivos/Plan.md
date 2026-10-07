# Plan de implementación — Upgrade 7

## Objetivo del plan

Permitir que el jugador genere sonidos en puntos configurados y comprobar que el guardia sólo aprende la posición después de una audición válida.

## Resultado de implementación

Completado. Se configuraron tres distractores estáticos; E activa el más cercano dentro de 56 px y crea un `SoundEvent` temporal en su posición. No hay recarga ni límite de usos. Q sigue siendo el sonido emitido desde el jugador.

Archivos: `src/application/simulation/labLevel.ts`, `src/application/simulation/soundDistractor.ts`, `src/game/scenes/GameScene.ts`.
Pruebas: `tests/application/soundDistractor.test.ts`, `tests/model/grid.test.ts`, `tests/application/perceptionSimulation.test.ts` y pruebas de prioridad H4.

## Cambios propuestos

| Paso | Cambio mínimo | Archivos previstos | Verificación | Riesgo | Condición de detención |
|---:|---|---|---|---|---|
| 1 | Definir distractores estáticos transitables/alcanzables y parámetros de activación | `src/application/simulation/labLevel.ts` o módulo de configuración específico; prueba de nivel | Validar coordenadas, radio y duración finitos | Ambigüedad de ubicación o interacción | Confirmar distribución y cantidad antes de codificar |
| 2 | Modelar interacción/cooldown en aplicación y emitir el `SoundEvent` existente | `src/application/simulation/perceptionSimulation.ts` o un coordinador de interacción separado; pruebas de aplicación | Interacción válida crea evento en dispositivo; inválida no modifica estado | Duplicar ciclo de vida de evento sonoro | Reutilizar `withSoundEvent`/`evaluateSound` donde encaje |
| 3 | Adaptar entrada y mostrar rango/estado del distractor | `src/game/scenes/GameScene.ts` | Secuencia manual de activación, alcance, expiración y reinicio | Phaser decide si guardia oye | La decisión de oír permanece en `evaluateSound` |
| 4 | Integrar percepción válida con memoria y FSM | `tests/perception/perception.test.ts`; `tests/perception/memory.test.ts`; `tests/behavior/guardBehavior.test.ts`; pruebas de secuencia | Guard fuera de radio no reacciona; dentro investiga; visión supera sonido | Uso de posición de jugador en vez de origen del sonido | Detener si un estímulo se conoce sin percepción |

## Orden de implementación

Separar configuración e interacción antes de conectar el sensor permite comprobar origen, vigencia y alcance. La FSM sólo recibirá el resultado sonoro validado, nunca una lista de distractores.

## Fuera de alcance

- Audio/voz grabados o recursos externos.
- Distractores móviles o aleatorios.
- Señuelos ilimitados si no se aprueba esa regla.
- Cambiar radio/duración base del sensor sin revisar sus pruebas.
