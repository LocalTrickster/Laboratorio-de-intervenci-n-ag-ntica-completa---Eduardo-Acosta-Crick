import { isWalkable, type GridMap, type GridPoint } from "../model/grid";

export function createSearchPattern(
  map: GridMap,
  center: GridPoint,
  radiusInCells: number,
): readonly GridPoint[] {
  if (!Number.isInteger(radiusInCells) || radiusInCells < 1) {
    throw new Error("Search radius must be a positive integer.");
  }

  const candidates: GridPoint[] = [];
  for (let distance = 1; distance <= radiusInCells; distance += 1) {
    for (let y = center.y - distance; y <= center.y + distance; y += 1) {
      for (let x = center.x - distance; x <= center.x + distance; x += 1) {
        if (
          Math.abs(x - center.x) + Math.abs(y - center.y) !== distance
          || !isWalkable(map, { x, y })
        ) {
          continue;
        }
        candidates.push({ x, y });
      }
    }
  }

  return candidates;
}
