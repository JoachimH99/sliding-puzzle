// Heuristic function for a square 2D sliding puzzle
export function heuristic(grid) {
    const gridSize = grid.length;
    let estimatedCost = 0;

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            let id = grid[row][col]
            estimatedCost += manhattanDistance(id, row, col, gridSize);
        }
    }
    return estimatedCost;
}

// Helper: Calculate Manhattan distance for a single element in a square 2D sliding puzzle
function manhattanDistance(id, row, column, gridSize) {
    let targetRow = Math.floor(id / gridSize)
    let targetColumn = id % gridSize
    return Math.abs(targetRow - row) + Math.abs(targetColumn - column)
}

// Helper: Copy grid
function copyGrid(grid) {
    return grid.map(row => [...row]);
}

// Get all possible moves for a given grid.
// Assumes the open tile has id of (grid size squared - 1)
export function get_neighbors(grid) {
    const gridSize = grid.length;
    const blankValue = gridSize * gridSize - 1;
    let neighbors = [];

    // Find blank tile position
    let blankRow, blankCol;
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (grid[row][col] === blankValue) {
                blankRow = row;
                blankCol = col;
                break;
            }
        }
    }

    // Possible moves: up, down, left, right
    const moves = [
        [blankRow - 1, blankCol], // up
        [blankRow + 1, blankCol], // down
        [blankRow, blankCol - 1], // left
        [blankRow, blankCol + 1]  // right
    ];

    for (let [newRow, newCol] of moves) {
        // Check boundaries
        if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
            let newGrid = copyGrid(grid);
            // Swap blank with neighbor
            [newGrid[blankRow][blankCol], newGrid[newRow][newCol]] =
                [newGrid[newRow][newCol], newGrid[blankRow][blankCol]];
            neighbors.push(newGrid);
        }
    }

    return neighbors;
}