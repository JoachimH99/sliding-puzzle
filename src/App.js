import { useState, useEffect } from "react";
import { solvePuzzle as aStarSolve } from "./solution/aStarAlgorithm.js";
import Confetti from "react-confetti";

const TILE_SIZE = 150; // size of each tile
const GAP = 5;         // spacing between tiles
const GRID_SIZE = 4;

const IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/e/e5/Blue-eyed_domestic_cat_%28Felis_silvestris_catus%29.jpg";

function App() {
    // initialize tiles: each tile knows its correct slice and current position
    const [tiles, setTiles] = useState(() => {
        const arr = [];
        for (let i = 0; i < GRID_SIZE * GRID_SIZE - 1; i++) {
            arr.push({
                id: i + 1,
                correctRow: Math.floor(i / GRID_SIZE),
                correctCol: i % GRID_SIZE,
                row: Math.floor(i / GRID_SIZE),
                col: i % GRID_SIZE,
            });
        }
        arr.push(null); // empty cell
        return arr;
    });

    const [solved, setSolved] = useState(false);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () =>
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Move by tile id (we render DOM in stable order; indices are separate)
    const moveTileById = (id) => {
        const index = tiles.findIndex((t) => t && t.id === id);
        if (index === -1) return;

        const emptyIndex = tiles.findIndex((t) => t === null);
        const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
        const emptyCol = emptyIndex % GRID_SIZE;

        const tile = tiles[index];
        if (
            (tile.row === emptyRow && Math.abs(tile.col - emptyCol) === 1) ||
            (tile.col === emptyCol && Math.abs(tile.row - emptyRow) === 1)
        ) {
            // create shallow copy of array and shallow copy of tile object to avoid mutation surprises
            const newTiles = [...tiles];
            const movingTile = { ...tile };

            // move tile's coordinates
            movingTile.row = emptyRow;
            movingTile.col = emptyCol;

            newTiles[emptyIndex] = movingTile;
            newTiles[index] = null;

            setTiles(newTiles);
            setSolved(checkSolved(newTiles));
        }
    };

    // check if solved: every tile in correct position and empty at last index
    const checkSolved = (tilesArr) => {
        for (let i = 0; i < tilesArr.length - 1; i++) {
            const t = tilesArr[i];
            if (!t) return false;
            if (t.row !== t.correctRow || t.col !== t.correctCol) return false;
        }
        // last cell should be empty (optional check)
        return tilesArr[tilesArr.length - 1] === null;
    };

    // shuffle by performing valid random moves (keeps solvable)
    const shuffleTiles = () => {
        let newTiles = [...tiles];
        for (let i = 0; i < 200; i++) {
            const emptyIndex = newTiles.findIndex((t) => t === null);
            const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
            const emptyCol = emptyIndex % GRID_SIZE;

            const moves = newTiles
                .map((tile, idx) => ({ tile, idx }))
                .filter(({ tile }) =>
                    tile &&
                    ((tile.row === emptyRow && Math.abs(tile.col - emptyCol) === 1) ||
                        (tile.col === emptyCol && Math.abs(tile.row - emptyRow) === 1))
                );

            if (moves.length === 0) continue;
            const { idx, tile } = moves[Math.floor(Math.random() * moves.length)];

            const movingTile = { ...tile };
            movingTile.row = emptyRow;
            movingTile.col = emptyCol;

            newTiles[emptyIndex] = movingTile;
            newTiles[idx] = null;
        }
        setTiles(newTiles);
        setSolved(false);
    };

    // Render tiles in stable DOM order (by id ascending). That prevents React from rearranging DOM nodes.
    const tilesToRender = tiles
        .filter(Boolean) // drop null for rendering (empty space not rendered)
        .slice() // copy
        .sort((a, b) => a.id - b.id);

    const solvePuzzle = () => {
        const blankValue = GRID_SIZE * GRID_SIZE - 1;

        // build 2D grid for solver
        const grid = Array.from({ length: GRID_SIZE }, (_, r) =>
            Array.from({ length: GRID_SIZE }, (_, c) => {
                const tile = tiles.find(t => t && t.row === r && t.col === c);
                return tile ? tile.id - 1 : blankValue;
            })
        );

        console.table(grid);

        const moves = aStarSolve(grid);
        if (!moves || moves.length === 0) {
            if (checkSolved(tiles)) setSolved(true);
            return;
        }

        let i = 0;
        const SPEED_MS = 150;

        const playNext = () => {
            if (i >= moves.length) {
                setSolved(true);
                return;
            }

            const moveId = moves[i] + 1;

            setTiles(prevTiles => {
                const emptyIndex = prevTiles.findIndex(t => t === null);
                const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
                const emptyCol = emptyIndex % GRID_SIZE;

                const tileIndex = prevTiles.findIndex(t => t && t.id === moveId);
                if (tileIndex === -1) return prevTiles;

                const tile = prevTiles[tileIndex];

                // check adjacency
                if (!((tile.row === emptyRow && Math.abs(tile.col - emptyCol) === 1) ||
                    (tile.col === emptyCol && Math.abs(tile.row - emptyRow) === 1))) {
                    console.warn(`Move ${moveId} is not adjacent to empty tile! Skipping.`);
                    return prevTiles;
                }

                const newTiles = [...prevTiles];
                const movingTile = { ...tile };

                movingTile.row = emptyRow;
                movingTile.col = emptyCol;

                newTiles[emptyIndex] = movingTile;
                newTiles[tileIndex] = null;

                return newTiles;
            });

            i++;
            setTimeout(playNext, SPEED_MS);
        };

        playNext();
    };

    return (
        <div
            style={{
                margin: 0,
                padding: 40,
                textAlign: "center",
                backgroundColor: "#3d3d3d", // ← your color here
                minHeight: "100vh",         // fill full viewport height
            }}
        >

            <div style={{ marginBottom: 12 }}>
                <button
                    onClick={shuffleTiles}
                    style={{
                        marginRight: 8,
                        padding: "8px 14px",
                        fontSize: "1rem",
                        cursor: "pointer",
                        borderRadius: 6,
                        backgroundColor: "#6a167d",
                        color: "white",
                        border: "none",
                    }}
                >
                    Shuffle
                </button>

                <button
                    onClick={solvePuzzle}   // your function to solve
                    style={{
                        marginLeft: 8,         // optional, just to match spacing
                        padding: "8px 14px",
                        fontSize: "1rem",
                        cursor: "pointer",
                        borderRadius: 6,
                        backgroundColor: "#2196f3", // different color
                        color: "white",
                        border: "none",
                    }}
                >
                    Solve
                </button>
            </div>

            <div
                style={{
                    position: "relative",
                    width: `${GRID_SIZE * TILE_SIZE + (GRID_SIZE + 1) * GAP}px`,
                    height: `${GRID_SIZE * TILE_SIZE + (GRID_SIZE + 1) * GAP}px`,
                    margin: "0 auto",
                    background: "#000000",
                    borderRadius: 3,
                }}
            >
                {tilesToRender.map((tile) => (
                    <div
                        key={tile.id}
                        onClick={() => moveTileById(tile.id)}
                        style={{
                            position: "absolute",
                            // ⬇ Add the gap offset for uniform border
                            top: `${(tile.row + 1) * GAP + tile.row * TILE_SIZE}px`,
                            left: `${(tile.col + 1) * GAP + tile.col * TILE_SIZE}px`,
                            width: `${TILE_SIZE}px`,
                            height: `${TILE_SIZE}px`,
                            cursor: "pointer",
                            borderRadius: 3,
                            transition: "top 0.1s ease, left 0.1s ease",
                            backgroundImage: `url(${IMAGE_URL})`,
                            backgroundSize: `${GRID_SIZE * TILE_SIZE}px ${GRID_SIZE * TILE_SIZE}px`,
                            backgroundPosition: `-${tile.correctCol * TILE_SIZE}px -${tile.correctRow * TILE_SIZE}px`,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        }}
                    />
                ))}
            </div>


            {solved && (
                <>
                    <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={400} gravity={0.6} />
                    <div style={{ color: "green", fontSize: "1.25rem", marginTop: 16 }}>🎉 Puzzle Solved! 🎉</div>
                </>
            )}
        </div>
    );
}

export default App;
