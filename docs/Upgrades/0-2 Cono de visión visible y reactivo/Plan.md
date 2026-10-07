# Plan de implementación — Upgrade 2

## Objetivo del plan

Hacer que el campo visual sea legible y fiel al sensor, sin duplicar reglas de percepción ni cambiar el contrato de la FSM.

## Resultado de implementación

Completado. El sensor y el render comparten rango y campo angular configurados en `labLevel.ts`; la escena presenta la causa de percepción con color y texto. La cobertura se integra como resultado explícito del sensor y no cambia el contrato de persecución.

Archivos: `src/application/simulation/labLevel.ts`, `src/domain/perception/perception.ts`, `src/game/presentation/guardPresentation.ts`, `src/game/scenes/GameScene.ts`.
Pruebas: percepción geométrica, razón de ocultamiento y mapeo exhaustivo de resultados visuales.

## Cambios propuestos

| Paso | Cambio mínimo | Archivos previstos | Verificación | Riesgo | Condición de detención |
|---:|---|---|---|---|---|
| 1 | Centralizar parámetros de visión accesibles a aplicación y representación | `src/application/simulation/guardSimulation.ts` o módulo de configuración existente; `src/game/scenes/GameScene.ts` | Comprobar que rango y FOV que dibuja la escena coinciden con los que recibe el sensor | Dos fuentes de verdad | Detener si exige migración/configuración no relacionada |
| 2 | Representar detección válida y causas de no detección con texto y señal visual | `src/game/scenes/GameScene.ts`; `tests/application/perceptionSimulation.test.ts` sólo si se amplía contrato | Escenarios visible, ocluido, fuera de cono y fuera de rango | Color inaccesible o percepción calculada en otra posición que la dibujada | Detener ante discrepancia entre sensor y render |
| 3 | Cubrir límites de clasificación y el vínculo con persecución | `tests/perception/perception.test.ts`; `tests/behavior/guardBehavior.test.ts` | Casos exactos de límite y rechazo de hipótesis visual no válida | Cambiar inadvertidamente geometría existente | Mantener las pruebas H3 sin alteración |

## Orden de implementación

Primero se elimina el riesgo de parámetros duplicados; después se presenta el resultado ya calculado; al final se verifica que sólo ese resultado active conducta.

## Fuera de alcance

- Rediseñar los umbrales de visión o la oclusión conservadora.
- Añadir efectos de alerta, cámara o animaciones.
- Consultar la ubicación actual del jugador desde el código de decisión.
