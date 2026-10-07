# Evidencia de pruebas — Upgrade 2

Estado: implementado y validado. Sensor y representación comparten parámetros de rango y ángulo.

| Criterio | Prueba automatizada | Resultado |
|---|---|---|
| Resultado visible/no visible y clasificación geométrica | `tests/perception/perception.test.ts` | Aprobado |
| Ocultamiento no se convierte en detección | `tests/perception/perception.test.ts`, `tests/application/perceptionSimulation.test.ts` | Aprobado |
| Mapeo tipado de resultados visuales, incluido `concealed` | `tests/presentation/guardPresentation.test.ts` | Aprobado |
| Validación completa | `npm run validate` | Typecheck y build aprobados; 67 pruebas en 10 archivos |

## Comprobación manual y límites

En navegador local, al cubrirse el jugador, el HUD informó `OCULTO` y el cono cambió de color. Los resultados del sensor cuentan con color y etiqueta; no se inspeccionaron visualmente todos los casos geométricos por separado. No hay prueba de navegador automatizada para contraste/capturas.
