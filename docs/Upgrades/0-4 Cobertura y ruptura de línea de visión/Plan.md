# Plan de implementación — Upgrade 6

## Objetivo del plan

Añadir una acción de sigilo que aproveche cobertura estática existente sin mezclar sensores con decisiones ni alterar el grafo de navegación.

## Resultado de implementación

Completado. Se añadieron cuatro celdas transitables como cobertura y la tecla H para ocultarse/exponerse; el movimiento cancela el ocultamiento. Percepción visual reporta `concealed`, sin alterar sonido ni escribir memoria visual.

Archivos: `src/application/simulation/labLevel.ts`, `src/domain/perception/perception.ts`, `src/application/simulation/perceptionSimulation.ts`, `src/game/scenes/GameScene.ts`.
Pruebas: `tests/perception/perception.test.ts`, `tests/application/perceptionSimulation.test.ts`, `tests/model/grid.test.ts`.

## Cambios propuestos

| Paso | Cambio mínimo | Archivos previstos | Verificación | Riesgo | Condición de detención |
|---:|---|---|---|---|---|
| 1 | Definir cobertura como celdas transitables y validar que pertenezcan al mapa | `src/application/simulation/labLevel.ts`; prueba de nivel | Cada punto de cobertura está dentro del mapa y es transitable | Cobertura sobre muro o fuera de límites | Detener si el mapa requiere generación dinámica |
| 2 | Añadir observación explícita de objetivo oculto sin sustituir geometría del sensor | `src/domain/perception/perception.ts`; `src/application/simulation/perceptionSimulation.ts`; pruebas de percepción | Objetivo oculto no da visión; sin ocultamiento se mantienen pruebas de rango, cono y oclusión | Ocultamiento se interpreta como posición o memoria | Detener si la memoria se actualiza sin evento sensorial válido |
| 3 | Coordinar tecla/estado de ocultamiento y presentarlo en Phaser | `src/game/scenes/GameScene.ts`; `src/application/simulation/guardSimulation.ts` | Entrar/salir de cobertura; confirmar que sólo se adapta la entrada y representa el resultado | La escena pasa a decidir reglas | Mantener regla en percepción/aplicación |
| 4 | Validar búsqueda tras ruptura de contacto y sonido concurrente | `tests/application/perceptionSimulation.test.ts`; `tests/behavior/guardBehavior.test.ts`; pruebas nuevas de secuencia | Memoria, prioridad visión/sonido y vencimiento de búsqueda | Sonido silenciado accidentalmente | Detener si el alcance incluye ocultar también sonido |

## Orden de implementación

Primero se definen datos válidos, después se modifica la salida del sensor de visión y al final se conecta entrada/presentación. Así puede comprobarse que ocultamiento no contamina memoria ni locomoción.

## Fuera de alcance

- Cobertura destructible o cambiante.
- Colisiones nuevas o movimiento agachado.
- Ocultamiento de audio.
- Ajustar visión, búsqueda o duración de memoria.
