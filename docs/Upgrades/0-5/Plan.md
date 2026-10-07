# Plan de intervención — Upgrade 7

## Objetivo del plan

Permitir que el jugador genere sonidos en puntos configurados y comprobar que el guardia sólo aprende la posición después de una audición válida.

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
