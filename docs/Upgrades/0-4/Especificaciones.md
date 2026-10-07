# Upgrade 6 — Cobertura y ruptura de línea de visión

## Problema

Las paredes bloquean la visión, pero el jugador no cuenta con una acción de sigilo explícita para aprovechar cobertura y romper contacto cuando está expuesto.

## Resultado esperado

En celdas de cobertura configuradas, el jugador puede ocultarse y dejar de ser una observación visual válida. Al salir de la cobertura, vuelve a estar sujeto al cono, rango y oclusión ya existentes. El guardia conserva la última posición conocida y busca al perder visión.

## Alcance

- Incluye: conjunto de celdas transitables de cobertura, acción de ocultarse/salir y señal de ocultamiento consumida por el sensor.
- No incluye: invisibilidad fuera de cobertura, ocultamiento de sonidos, cambios a memoria, cambios de alcance, invulnerabilidad o cobertura dinámica.

## Restricciones

- Técnicas: la regla “objetivo oculto” debe ser dato explícito de percepción; el dominio no importa Phaser; presentación/adaptador traduce entrada y dibuja el indicador.
- Operativas: mapa y cobertura definidos por código, sin assets ni dependencias externas.
- De calidad: ocultarse no escribe una posición nueva en memoria; el sonido validado sigue siendo audible; salir de la cobertura no debe restaurar percepción si una pared todavía bloquea la línea.

## Casos y criterios de aceptación

| Caso | Dado | Cuando | Entonces | Evidencia |
|---|---|---|---|---|
| Ocultamiento válido | Jugador sobre una celda marcada y guardia con línea despejada | Activa ocultamiento | Visión resulta no válida, memoria visual no cambia y el guardia pasa a Buscar | Prueba de percepción, memoria y FSM |
| Ruptura de contacto | El guardia persigue y el jugador alcanza cobertura | Se oculta | Se interrumpe visión; al llegar a última posición el guardia inicia búsqueda temporizada | Prueba de secuencia aplicación |
| Salida de cobertura | Jugador deja cobertura visible | El sensor evalúa la escena | Sólo si rango, cono y oclusión lo permiten se registra visión y se persigue | Pruebas de geometría y secuencia manual |
| Ruido desde cobertura | Jugador oculto emite sonido | El guardia está dentro del radio | La visión no se activa; el sonido puede causar Investigación según prioridad | Prueba simultánea de sensores |

## Invariantes

- La cobertura afecta sólo a la percepción visual, no altera el mapa transitable.
- La última posición conocida cambia sólo por visión válida o sonido oído.
- Visión válida conserva prioridad sobre sonido; estar oculto no invalida un sonido independiente.
- Ocultamiento no depende de color/render para ser aplicado por la regla.

## Preguntas abiertas

- Definir cantidad y coordenadas de coberturas y si ocultarse es automático o requiere tecla. Propuesta: interacción explícita en celdas marcadas.
- Definir si existe animación/postura de ocultamiento; se recomienda posponerla al Upgrade 3.
