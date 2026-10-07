# Upgrade 1 — Patrulla con pausas y mirada direccional

## Problema

La patrulla cíclica es legible, pero un guardia que invierte su desplazamiento sin pausa ni anticipación parece mecánico y ofrece menos oportunidades de observar su campo visual.

## Resultado esperado

Al llegar a un waypoint de patrulla, el guardia se detiene durante una pausa configurable, orienta su mirada hacia el siguiente tramo y luego reanuda la ruta cíclica. La locomoción, la orientación visual y la selección de conducta continúan siendo componentes separados.

## Alcance

- Incluye: pausa en waypoints de patrulla, dirección de mirada observable y reanudación de la ruta ya seleccionada.
- No incluye: pausa al investigar, perseguir, buscar o regresar; cambios en reglas de percepción; animaciones; nuevos recursos visuales.

## Restricciones

- Técnicas: la duración y el instante de inicio se controlan con tiempo explícito; el dominio no importa Phaser ni APIs del navegador; Phaser presenta la orientación.
- Operativas: no instalar dependencias ni descargar recursos.
- De calidad: el estado de patrulla y la ruta se conservan durante la pausa; ningún avance de locomoción ocurre mientras el temporizador de pausa esté activo.

## Casos y criterios de aceptación

| Caso | Dado | Cuando | Entonces | Evidencia |
|---|---|---|---|---|
| Pausa y mirada | El guardia llega a un waypoint de una ruta válida | Comienza la pausa | La posición no cambia y la mirada apunta al siguiente tramo; al vencer la pausa se continúa el ciclo | Prueba determinista con reloj controlado y secuencia manual |
| Destino inválido | El waypoint siguiente no es transitable | Se intenta seleccionarlo | Se registra el fallo y no se informa una llegada falsa | Prueba de mapa con punto bloqueado |
| Estímulo prioritario | El guardia está en pausa de patrulla | Se valida visión o sonido | La pausa se cancela y la FSM aplica la prioridad definida en H4 | Prueba de secuencia FSM |

## Invariantes

- La pausa no recalcula una ruta ni desplaza al guardia.
- La mirada usa una dirección finita y no convierte por sí misma una orientación en percepción válida.
- La llegada y la reanudación generan telemetría observable.
- Visión conserva prioridad sobre sonido durante la pausa.

## Preguntas abiertas

- Confirmar duración de pausa y si la mirada debe seguir el próximo waypoint o recorrer un patrón de direcciones. Propuesta inicial: 700 ms mirando al siguiente tramo.
- Confirmar si el mismo intervalo aplica a todos los puntos de patrulla.
