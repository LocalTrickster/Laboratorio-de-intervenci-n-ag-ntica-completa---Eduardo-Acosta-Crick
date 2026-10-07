---
id: laboratorio-guardia-sigilo-h3-percepcion-movimiento
titulo: Percepción y movimiento del guardia
tipo: laboratorio
nivel: obligatorio
audiencia: estudiante
clases: [9, 10]
modalidad: mixta
resultados: [RA7, RA8, RA11]
prerrequisitos: [laboratorio-guardia-sigilo-producto]
evaluable: true
acceso: publico
version: 1
---

# Percepción y movimiento del guardia

## Propósito

H3 incorpora sensores, memoria y locomoción sin agregar todavía una arquitectura de decisión. Esta separación permite observar qué sabe el guardia antes de decidir qué debe hacer.

## Parámetros de la demostración

| Parámetro | Valor |
|---|---:|
| Velocidad del guardia | 115 px/s |
| Alcance visual | 220 px |
| Campo visual | 90 grados |
| Radio sonoro | 190 px |
| Duración del sonido | 800 ms |

## Controles

- WASD o flechas: mover al jugador.
- Espacio: alternar BFS y A* para las rutas automáticas del guardia.
- Q: emitir un sonido desde la posición del jugador.
- R: recuperar el estado inicial reproducible.

## Evidencia observable

- El cono azul representa alcance y ángulo visual; cambia a verde durante una detección válida.
- Una pared entre guardia y jugador produce el estado `OCLUIDO`.
- El círculo amarillo representa el alcance del último sonido activo.
- El marcador rojo conserva la última posición conocida por visión o sonido.
- La telemetría informa causa visual, resultado sonoro, fuente de memoria y antigüedad.
- El guardia recorre centros de celdas sin ejecutar nuevamente la búsqueda en cada cuadro.

## Experimentos reproducibles sobre percepción y locomoción

1. Observar una ruta automática entre puntos de patrulla y comprobar que el guardia sigue los centros de celda mostrados.
2. Situar al jugador delante y cerca del guardia para obtener `VISIBLE`.
3. Interponer una pared sin cambiar rango ni orientación para obtener `OCLUIDO`.
4. Ubicar al jugador fuera del cono pero dentro del radio sonoro y presionar Q.
5. Esperar la expiración del sonido y comprobar que la memoria conserva posición, fuente y tiempo.
6. Presionar R y comprobar que ruta, algoritmo, sonido y memoria vuelven al estado inicial.

## Límite original de H3

En H3 el guardia sólo seguía destinos indicados por una persona. H4 reemplaza ese control manual por la máquina autónoma documentada en [h4-maquina-estados.md](h4-maquina-estados.md); percepción, memoria y locomoción de este hito permanecen como base de esa decisión.
