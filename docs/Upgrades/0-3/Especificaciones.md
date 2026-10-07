# Upgrade 3 — Animaciones por estado y transición

## Problema

Los estados de conducta pueden cambiar correctamente y, aun así, resultar difíciles de reconocer si el guardia conserva la misma representación visual.

## Resultado esperado

La presentación distingue Patrullar, Investigar, Perseguir, Buscar y Regresar, y ofrece una respuesta breve a cada transición registrada. El estado lógico sigue siendo la única fuente de verdad.

## Alcance

- Incluye: representación visual por estado y respuesta cosmética asociada a eventos de transición; uso de formas y tweens de Phaser ya disponibles.
- No incluye: recursos gráficos o animaciones externas, alterar la FSM, modificar velocidad/ruta mediante animación, ni añadir dependencias.

## Restricciones

- Técnicas: animación en `src/game/` o presentación; no importar Phaser desde dominio/aplicación; detener o reemplazar animaciones al reiniciar la escena.
- Operativas: escena base dibujada por código.
- De calidad: cada transición conserva telemetría; animación no retrasa ni bloquea percepción, navegación o locomoción.

## Casos y criterios de aceptación

| Caso | Dado | Cuando | Entonces | Evidencia |
|---|---|---|---|---|
| Animación por estado | El guardia cambia entre estados H4 | Se presenta el cuadro | La apariencia identifica el estado actual sin modificar el estado lógico | Prueba de mapeo de estado y revisión visual |
| Respuesta por transición | Ocurre una transición con evento registrado | La escena recibe telemetría | Se inicia una respuesta finita, asociada a ese evento y no repetida cada cuadro | Prueba de evento consumido una sola vez |
| Reinicio/interrupción | Una animación está en curso | Se reinicia o llega otra transición | La anterior se detiene/reemplaza y el estado visual queda consistente | Prueba/inspección tras R y secuencia rápida |

## Invariantes

- Las animaciones no deciden ni infieren conducta.
- Una actualización repetida sin transición no vuelve a iniciar el efecto.
- La orientación y locomoción siguen la salida del seguidor de rutas, salvo una mirada explícita de patrulla aprobada por el Upgrade 1.
- No se usan assets externos.

## Preguntas abiertas

- Elegir vocabulario visual (tinte, escala, pulso o combinación) que no confunda estado con resultado de visión.
- Definir duración de cada respuesta y si Buscar debe distinguirse de Investigar por forma o sólo por color/texto.
