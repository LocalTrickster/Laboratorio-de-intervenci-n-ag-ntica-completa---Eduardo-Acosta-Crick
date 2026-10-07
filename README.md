---
id: laboratorio-guardia-sigilo
titulo: Laboratorio Guardia de Sigilo
tipo: indice
audiencia: estudiante
acceso: publico
version: 3
---

# Laboratorio Guardia de Sigilo

Proyecto canónico de PIAPC 2026 para aplicar desarrollo agéntico e inteligencia artificial de videojuegos.

## Estado

H0 a H4 implementados: escenario base, navegación BFS/A*, percepción con memoria y conducta autónoma del guardia. También están implementados cinco upgrades del catálogo: patrulla con pausas y mirada, cono visual reactivo, feedback animado por estado, cobertura y distractores sonoros.

## Ejecución

Requiere Node.js 22 o superior.

```bash
npm ci
npm run dev
```

Validación completa:

```bash
npm run validate
```

En la escena:

- WASD o flechas: mover al jugador.
- Espacio: alternar BFS y A* para las rutas automáticas del guardia.
- Q: emitir un sonido desde el jugador.
- H: ocultarse o exponerse en una celda de cobertura.
- E: activar el distractor sonoro más cercano dentro del alcance.
- R: reiniciar el escenario.
- El guardia patrulla con pausas; visión válida inicia persecución, sonido oído inicia investigación y perder visión inicia una búsqueda limitada antes del retorno.

## Propósito

Construir un juego 2D cenital mínimo donde un guardia:

- patrulla puntos definidos;
- percibe al jugador mediante visión y sonido;
- conserva una última posición conocida;
- navega mediante A*;
- sigue caminos sin mezclar búsqueda y locomoción;
- decide mediante una máquina de estados;
- expone telemetría suficiente para comprender y probar su conducta.

El proyecto no busca producir un videojuego comercial. Es un entorno de experimentación controlado, reproducible y apto para personas y agentes de desarrollo.

## Documentos

- [Especificación del producto](specs/01-producto.md)
- [Especificación pedagógica](specs/02-pedagogica.md)
- [Arquitectura](docs/arquitectura.md)
- [Hitos](docs/hitos.md)
- [Contrato para proyectos alternativos](docs/contrato-proyecto-alternativo.md)
- [Decisiones técnicas](docs/decisiones-tecnicas.md)
- [Auditoría H1](docs/auditoria-h1.md)
- [Permisos recomendados](docs/permisos-recomendados.md)
- [Registro de intervención](docs/plantillas/registro-intervencion.md)
- [Evidencia de pruebas](docs/plantillas/evidencia-pruebas.md)
- [H3: percepción y movimiento](docs/h3-percepcion-movimiento.md)
- [H4: máquina de estados del guardia](docs/h4-maquina-estados.md)
- [Upgrade 1: patrulla con pausas y mirada direccional](docs/Upgrades/0-1%20Patrulla%20con%20pausas%20y%20mirada%20direccional/specs.md)
- [Upgrade 2: cono de visión visible y reactivo](docs/Upgrades/0-2%20Cono%20de%20visi%C3%B3n%20visible%20y%20reactivo/specs.md)
- [Upgrade 3: animaciones por estado y transición](docs/Upgrades/0-3%20Animaciones%20por%20estado%20y%20transici%C3%B3n/specs.md)
- [Upgrade 6: cobertura y ruptura de línea de visión](docs/Upgrades/0-4%20Cobertura%20y%20ruptura%20de%20l%C3%ADnea%20de%20visi%C3%B3n/specs.md)
- [Upgrade 7: distractores sonoros interactivos](docs/Upgrades/0-5%20Distractores%20sonoros%20interactivos/specs.md)
- [Entrega preparada para la plataforma](docs/entrega.md)
- [Intervención H3](docs/evidencias/h3-intervencion.md)
- [Validación H3](docs/evidencias/h3-validacion.md)

## Tecnología de referencia

- Phaser con TypeScript.
- Vite para desarrollo y compilación.
- Vitest para pruebas de dominio.
- Node.js 22 o superior.
- npm y archivo de bloqueo para instalaciones reproducibles.

El estudiante puede adoptar Unity u otro entorno si cumple el contrato de equivalencia.

## Restricción principal

La lógica de navegación, percepción y decisión no dependerá de Phaser. El motor será un adaptador de entrada, tiempo, colisiones y representación visual.
