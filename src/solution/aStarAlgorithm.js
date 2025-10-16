import { Heap } from 'heap-js';
import { heuristic, get_neighbors } from './gridUtils.js';

// Helper: stringify grid for using in sets/maps
function gridToString(grid) {
    return grid.map(row => row.join(',')).join(';');
}

// Helper: find the tile that moved between two grids
function findMovedTile(oldGrid, newGrid) {
    const gridSize = oldGrid.length;
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (oldGrid[r][c] !== newGrid[r][c]) {
                const diff = newGrid[r][c];
                if (diff !== gridSize * gridSize - 1) { // ignore blank
                    return diff;
                }
            }
        }
    }
}

// A* algorithm returning the list of moved tiles
export function solvePuzzle(startGrid) {
    const gridSize = startGrid.length;
    const goalGrid = [];
    let counter = 0;
    for (let r = 0; r < gridSize; r++) {
        const row = [];
        for (let c = 0; c < gridSize; c++) {
            row.push(counter++);
        }
        goalGrid.push(row);
    }

    const startStr = gridToString(startGrid);
    const goalStr = gridToString(goalGrid);

    // Create a min-heap based on fScore
    const openSet = new Heap((a, b) => a.fScore - b.fScore);
    openSet.push({ grid: startGrid, fScore: heuristic(startGrid), gridStr: startStr });
    
    const openSetContains = new Set([startStr]); // Track what's in the heap
    const cameFrom = new Map(); // gridStr -> previous grid

    const gScore = new Map();
    gScore.set(startStr, 0);

    const closedSet = new Set();

    while (openSet.length > 0) {
        const current = openSet.pop();
        const currentStr = current.gridStr;
        
        openSetContains.delete(currentStr);

        if (currentStr === goalStr) {
            // Reconstruct path as list of moved tiles
            const moves = [];
            let node = current.grid;
            while (cameFrom.has(gridToString(node))) {
                const prev = cameFrom.get(gridToString(node));
                moves.unshift(findMovedTile(prev, node));
                node = prev;
            }
            return moves;
        }

        closedSet.add(currentStr);

        for (const neighbor of get_neighbors(current.grid)) {
            const neighborStr = gridToString(neighbor);
            if (closedSet.has(neighborStr)) continue;

            const tentativeG = gScore.get(currentStr) + 1;

            if (!gScore.has(neighborStr) || tentativeG < gScore.get(neighborStr)) {
                cameFrom.set(neighborStr, current.grid);
                gScore.set(neighborStr, tentativeG);
                const f = tentativeG + heuristic(neighbor);

                if (!openSetContains.has(neighborStr)) {
                    openSet.push({ grid: neighbor, fScore: f, gridStr: neighborStr });
                    openSetContains.add(neighborStr);
                }
            }
        }
    }
    console.log("No solution found!");
    return null; // unsolvable
}
