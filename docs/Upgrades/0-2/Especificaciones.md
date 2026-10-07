# Upgrade 2 — Cono de visión visible y reactivo

## Problema

La representación del cono no siempre comunica con precisión el resultado del sensor ni el momento en que una detección pasa a ser válida.

## Resultado esperado

El cono dibujado refleja exactamente el rango y campo visual usados por percepción; cambia de apariencia ante detección válida y la interfaz muestra una causa comprensible cuando el jugador queda fuera de rango, fuera del cono o detrás de una pared.

## Alcance

- Incluye: sincronización entre parámetros del sensor y render, respuesta visual a `VisionResult`, leyenda/estado accesible.
- No incluye: modificar alcance, ángulo, oclusión, memoria o decisión; perseguir por proximidad sin `visible`.

## Restricciones

- Técnicas: `src/domain/perception/` continúa libre de Phaser; la escena sólo representa el resultado producido por dominio/aplicación.
- Operativas: sin dependencias ni assets externos; preferir figuras, color y texto existentes.
- De calidad: no duplicar valores de rango/FOV entre sensor y representación; el color no es la única señal del estado.

## Casos y criterios de aceptación

| Caso | Dado | Cuando | Entonces | Evidencia |
|---|---|---|---|---|
| Contacto válido | Objetivo dentro de rango y cono, sin oclusión | Se actualiza percepción | El cono indica detección y el HUD informa `VISIBLE` | Prueba de percepción existente más verificación de presentación |
| Sin contacto por oclusión | Hay pared en la línea | Se evalúa visión | No se marca al jugador como visto; la presentación señala oclusión | `tests/perception/perception.test.ts` y secuencia manual |
| Límite geométrico | El objetivo está exactamente fuera del cono o del rango | Se evalúa el sensor | Representación y causa corresponden al resultado del sensor; no se dispara persecución | Pruebas de límites y FSM |

## Invariantes

- Sólo `VisionResult.visible` permite actualizar posición conocida por visión e iniciar/continuar Perseguir.
- La visualización nunca convierte una posición cruda del jugador en una observación.
- Sensor y cono comparten los mismos parámetros y criterio de oclusión.
- El estado se comunica mediante texto además del color.

## Preguntas abiertas

- Confirmar si se desea distinguir `outside-cone`, `out-of-range` y `occluded` con patrones/contornos diferentes además del texto.
- Verificar contraste de la paleta sobre el fondo actual.
