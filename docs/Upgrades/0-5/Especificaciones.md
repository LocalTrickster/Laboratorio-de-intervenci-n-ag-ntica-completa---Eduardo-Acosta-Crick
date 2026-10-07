# Upgrade 7 — Distractores sonoros interactivos

## Problema

El sonido actual nace en la ubicación del jugador. Faltan oportunidades de emitir un estímulo en otro punto del escenario para planificar una distracción y observar una investigación verificable.

## Resultado esperado

El jugador puede activar un distractor sonoro configurado en el escenario. El evento tiene una posición, radio, instante y duración explícitos; sólo un guardia dentro de su alcance lo oye, registra esa observación y puede investigar el punto. Visión válida mantiene prioridad.

## Alcance

- Incluye: dispositivos/puntos de sonido configurados, interacción dentro de distancia permitida y evento temporal que reutiliza el sensor sonoro actual.
- No incluye: audio de producción, audio espacial, red, nuevos enemigos, sonidos falsos generados por IA o conocimiento del distractor por el guardia antes de oírlo.

## Restricciones

- Técnicas: el dominio recibe un `SoundEvent` neutral; interacción y presentación pertenecen a adaptadores/aplicación; no consultar datos de distractores desde la decisión antes de una observación.
- Operativas: efectos visuales/sonoros opcionales deben usar formas o Web Audio sólo si se aprueba explícitamente; no descargar recursos.
- De calidad: el evento expira; la memoria cambia únicamente si `heard` es verdadero; simultaneidad con visión se resuelve a favor de visión.

## Casos y criterios de aceptación

| Caso | Dado | Cuando | Entonces | Evidencia |
|---|---|---|---|---|
| Activación | Jugador dentro del alcance interactivo de un distractor disponible | Presiona la acción configurada | Se crea evento en la posición del distractor, no en la del jugador | Prueba de coordinación de entrada/evento |
| Fuera de alcance | Jugador lejos del dispositivo | Intenta activarlo | No se crea un evento válido y la UI informa que no se activó | Prueba de guardia de interacción |
| Guard oye | Evento activo y guardia dentro del radio | Se evalúa sonido | Memoria registra fuente `sound` y la FSM entra en Investigar si no hay visión válida | Pruebas de percepción, memoria y FSM |
| Conflicto/expiración | Visión válida simultánea o sonido vencido | Se actualiza la simulación | Visión prevalece; expiración no borra memoria ni dispara Investigación | Pruebas de prioridad y tiempo |

## Invariantes

- Un distractor no revela su posición al guardia hasta que lo oye.
- Un evento no activo o fuera de radio no actualiza memoria.
- La posición de memoria corresponde al origen del sonido percibido, no a la posición del jugador.
- Cada activación, audición y expiración relevante es observable en telemetría.

## Preguntas abiertas

- Definir cantidad/ubicación de distractores, distancia de interacción, reutilización y si el jugador cuenta con cargas limitadas. Propuesta de primer corte: dispositivos estáticos interactuables con una recarga temporal común.
- Elegir tecla de interacción y feedback accesible; evitar conflicto con controles de cobertura.
