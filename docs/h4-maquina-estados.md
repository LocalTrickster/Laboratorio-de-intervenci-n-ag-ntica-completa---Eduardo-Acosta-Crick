---
id: laboratorio-guardia-sigilo-h4
titulo: Máquina de estados del guardia
tipo: laboratorio
audiencia: estudiante
acceso: publico
version: 1
---

# H4 — Máquina de estados del guardia

## Alcance implementado

La conducta autónoma usa cinco estados: Patrullar, Investigar, Perseguir, Buscar y Regresar. La decisión es una función pura en `src/domain/behavior/guardBehavior.ts`; la búsqueda de candidatos locales está aislada en `src/domain/behavior/searchPattern.ts`; los eventos tipados están en `src/domain/telemetry/guardTelemetry.ts`; `src/application/simulation/guardSimulation.ts` coordina navegación, decisión y seguimiento; Phaser sólo envía entradas/tiempo y representa resultados en `src/game/scenes/GameScene.ts`.

El dominio no depende de Phaser, DOM ni APIs del navegador. Sensores y memoria permanecen en `src/domain/perception/` y `src/application/simulation/perceptionSimulation.ts`; la locomoción sigue delegada a `src/domain/navigation/pathFollower.ts`.

## Parámetros reproducibles

| Parámetro | Valor actual |
|---|---:|
| Velocidad del guardia | 115 px/s |
| Radio visual | 220 px |
| Campo visual | 90 grados |
| Radio sonoro | 190 px |
| Duración de un evento sonoro | 800 ms |
| Puntos de patrulla | (27,17), (27,2), (2,2), (2,17) |
| Radio de búsqueda local | 2 celdas, distancia Manhattan |
| Duración máxima de búsqueda | 6000 ms |

## Reglas de decisión

1. Visión válida es prioritaria sobre sonido y navegación; sólo esa observación o un sonido oído pueden actualizar memoria.
2. Una observación visual inicia/actualiza Perseguir. La ruta a un objetivo se conserva mientras la celda objetivo no cambie; cambiar entre BFS y A* es una acción explícita de demostración.
3. Al perder visión, el guardia conserva la última posición conocida y navega hasta ella. El reloj limitado comienza al llegar, no mientras recorre la ruta.
4. Investigar llega a la posición del sonido validado y continúa como búsqueda local temporizada.
5. Buscar selecciona candidatos transitables deterministas cercanos al ancla. Un sonido oído puede reorientar el área sin reiniciar el plazo; una visión válida vuelve a Perseguir.
6. Al vencer la búsqueda, el guardia regresa al punto de patrulla seleccionado. Si un destino falla, prueba puntos restantes; si no hay ninguno alcanzable, permanece en Regresar sin movimiento y con telemetría de fallo.
7. Cada cambio de estado u objetivo, incluyendo llegada cíclica al mismo estado, produce un evento con tiempo, origen, destino, causa y objetivo. Se conserva una cola de hasta 100 eventos; el HUD muestra los más recientes.

## Controles

- WASD/flechas: mover al jugador.
- Q: emitir sonido desde el jugador.
- Espacio: alternar BFS/A* para comparar la ruta actual.
- R: reiniciar el escenario.

## Pruebas

- `tests/behavior/guardBehavior.test.ts`: prioridades, estados, búsqueda, expiración, retorno inaccesible y patrón determinista.
- `tests/application/guardSimulation.test.ts`: integración ruta/locomoción, conservación de rutas y fallo sin falsa llegada.
- `tests/perception/` y `tests/navigation/`: contratos previos de sensores, memoria, búsqueda y seguidor de caminos.

Los upgrades opcionales de pausas de patrulla, cono reactivo, animación, cobertura y distractores son trabajo separado; sus documentos en `docs/Upgrades/0-1` a `0-5` son planes, no capacidades implementadas.
