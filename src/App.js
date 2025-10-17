import { useState, useEffect } from "react";
import { solvePuzzle as aStarSolve } from "./solution/aStarAlgorithm.js";
import Confetti from "react-confetti";

const GRID_SIZE = 4;

const IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/e/e5/Blue-eyed_domestic_cat_%28Felis_silvestris_catus%29.jpg";

function App() {
    // Calculate responsive tile size
    const calculateTileSize = () => {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const maxSize = Math.min(screenWidth, screenHeight) * 0.85; // 85% of smaller dimension
        const tileSize = Math.floor((maxSize - (GRID_SIZE + 1) * 5) / GRID_SIZE); // Account for gaps
        return Math.min(tileSize, 150); // Cap at 150px for large screens
    };

    const [tileSize, setTileSize] = useState(calculateTileSize());
    const GAP = Math.max(2, Math.floor(tileSize * 0.01)); // Responsive gap

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
        // Prevent scrolling
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            setTileSize(calculateTileSize());
        };
        window.addEventListener("resize", handleResize);
        
        return () => {
            // Cleanup - restore scrolling when component unmounts
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
            window.removeEventListener("resize", handleResize);
        };
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

    const buttonStyle = {
        padding: "12px 24px",
        fontSize: "2rem",
        cursor: "pointer",
        borderRadius: 8,
        color: "white",
        border: "none",
        minWidth: "120px",
        fontWeight: "600",
        touchAction: "manipulation", // Better touch response
        flex: 1,
    };

    return (
        <div
            style={{
                margin: 0,
                padding: 0,
                textAlign: "center",
                backgroundColor: "#ffffff",
                minHeight: "100vh",
                height: "100vh",
                width: "100vw",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                position: "fixed",
                top: 0,
                left: 0,
            }}
        >


            <div
                style={{
                    position: "relative",
                    width: `${GRID_SIZE * tileSize + (GRID_SIZE + 1) * GAP}px`,
                    height: `${GRID_SIZE * tileSize + (GRID_SIZE + 1) * GAP}px`,
                    background: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.7)), url(${IMAGE_URL})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 3,
                    touchAction: "manipulation",
                }}
            >
                {tilesToRender.map((tile) => (
                    <div
                        key={tile.id}
                        onClick={() => moveTileById(tile.id)}
                        style={{
                            position: "absolute",
                            top: `${(tile.row + 1) * GAP + tile.row * tileSize}px`,
                            left: `${(tile.col + 1) * GAP + tile.col * tileSize}px`,
                            width: `${tileSize}px`,
                            height: `${tileSize}px`,
                            cursor: "pointer",
                            borderRadius: 2,
                            transition: "top 0.1s ease, left 0.1s ease",
                            backgroundImage: `url(${IMAGE_URL})`,
                            backgroundSize: `${GRID_SIZE * tileSize}px ${GRID_SIZE * tileSize}px`,
                            backgroundPosition: `-${tile.correctCol * tileSize}px -${tile.correctRow * tileSize}px`,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                            touchAction: "manipulation",
                        }}
                    />
                ))}
            </div>

            <div style={{
                marginTop: 10,
                display: "flex",
                gap: "10px",
                width: `${GRID_SIZE * tileSize + (GRID_SIZE + 1) * GAP}px`,
            }}>
                <button
                    onClick={shuffleTiles}
                    style={{
                        ...buttonStyle,
                        backgroundColor: "#db8000",
                    }}
                >
                    Shuffle
                </button>

                <button
                    onClick={solvePuzzle}
                    style={{
                        ...buttonStyle,
                        backgroundColor: "#109e00",
                    }}
                >
                    Solve
                </button>
            </div>

            {solved && (
                <>
                    <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={400} gravity={0.6} />
                </>
            )}
        </div>
    );
}

export default App;
