const GRID_SIZE = 5;
const WIN_VALUE = null; // infinite mode — no win condition

let grid = [];
let score = 0;
let bestScore = 0;
let maxTile = 0;
let gameOver = false;

// Initialize empty grid
function createEmptyGrid() {
    return Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, () => 0)
    );
}

// Get all empty cell positions
function getEmptyCells(g) {
    const cells = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (g[r][c] === 0) cells.push({ r, c });
        }
    }
    return cells;
}

// Add a random tile (90% chance 2, 10% chance 4)
function addRandomTile(g) {
    const empty = getEmptyCells(g);
    if (empty.length === 0) return null;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    g[r][c] = Math.random() < 0.9 ? 2 : 4;
    return { r, c, value: g[r][c] };
}

// Initialize new game
function initGame() {
    grid = createEmptyGrid();
    score = 0;
    gameOver = false;
    addRandomTile(grid);
    addRandomTile(grid);
    updateMaxTile();
    render();
    updateScoreboard();
    hideGameOver();
}

// Slide a single row to the left and merge
function slideRow(row) {
    let tiles = row.filter(v => v !== 0);
    let merged = [];
    let i = 0;

    while (i < tiles.length) {
        if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
            const mergedValue = tiles[i] * 2;
            merged.push(mergedValue);
            score += mergedValue;
            i += 2;
        } else {
            merged.push(tiles[i]);
            i++;
        }
    }

    while (merged.length < GRID_SIZE) {
        merged.push(0);
    }

    return merged;
}

function rowsEqual(a, b) {
    return a.every((v, i) => v === b[i]);
}

function gridsEqual(a, b) {
    for (let r = 0; r < GRID_SIZE; r++) {
        if (!rowsEqual(a[r], b[r])) return false;
    }
    return true;
}

// Move all tiles in a direction
function move(direction) {
    if (gameOver) return;

    const previous = grid.map(row => [...row]);

    let rotated = false;
    let gridToSlide = grid.map(row => [...row]);

    if (direction === 'up') {
        gridToSlide = rotateGrid(gridToSlide, 1);
        rotated = true;
    } else if (direction === 'down') {
        gridToSlide = rotateGrid(gridToSlide, -1);
        rotated = true;
    } else if (direction === 'right') {
        gridToSlide = gridToSlide.map(row => [...row].reverse());
        rotated = true;
    }
    // left: no transformation needed

    const newGrid = gridToSlide.map(row => slideRow(row));

    let result;
    if (direction === 'up') {
        result = rotateGrid(newGrid, -1);
    } else if (direction === 'down') {
        result = rotateGrid(newGrid, 1);
    } else if (direction === 'right') {
        result = newGrid.map(row => [...row].reverse());
    } else {
        result = newGrid;
    }

    if (gridsEqual(grid, result)) return;

    grid = result;
    updateMaxTile();
    addRandomTile(grid);
    updateScoreboard();
    render();

    if (isGameOver()) {
        gameOver = true;
        showGameOver();
    }
}

function rotateGrid(g, dir) {
    const n = g.length;
    const rotated = createEmptyGrid();
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (dir === 1) {
                rotated[n - 1 - c][r] = g[r][c];
            } else {
                rotated[c][n - 1 - r] = g[r][c];
            }
        }
    }
    return rotated;
}

function isGameOver() {
    if (getEmptyCells(grid).length > 0) return false;

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const val = grid[r][c];
            if (c + 1 < GRID_SIZE && grid[r][c + 1] === val) return false;
            if (r + 1 < GRID_SIZE && grid[r + 1][c] === val) return false;
        }
    }
    return true;
}

function updateMaxTile() {
    let max = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] > max) max = grid[r][c];
        }
    }
    maxTile = max;
}

function saveBestScore() {
    if (score > bestScore) {
        bestScore = score;
        try {
            localStorage.setItem('2048-best-score', bestScore.toString());
        } catch (e) {
            // localStorage unavailable — silently ignore
        }
    }
}

function loadBestScore() {
    try {
        const saved = localStorage.getItem('2048-best-score');
        bestScore = saved ? parseInt(saved, 10) : 0;
    } catch (e) {
        bestScore = 0;
    }
}

function saveGame() {
    const state = { grid, score, maxTile };
    try {
        localStorage.setItem('2048-game-state', JSON.stringify(state));
    } catch (e) {
        // localStorage full or unavailable — silently ignore
    }
}

function loadGame() {
    try {
        const saved = localStorage.getItem('2048-game-state');
        if (!saved) return false;
        const state = JSON.parse(saved);
        if (!state.grid || state.grid.length !== GRID_SIZE) return false;
        grid = state.grid;
        score = state.score || 0;
        maxTile = state.maxTile || 0;
        return true;
    } catch (e) {
        return false;
    }
}

function clearSavedGame() {
    localStorage.removeItem('2048-game-state');
}
