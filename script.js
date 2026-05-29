const GRID_SIZE = 5;
const WIN_VALUE = null; // infinite mode — no win condition

let grid = [];
let score = 0;
let bestScore = 0;
let maxTile = 0;
let gameOver = false;
let newTilePos = null;   // { r, c } of tile added after a move
let mergedPositions = []; // [{ r, c }] of tiles that just merged

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
    newTilePos = { r, c };
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

    mergedPositions = [];
    newTilePos = null;

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
    mergedPositions = findMergedTiles(previous, grid);
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

// Find tiles that merged by comparing before/after states
function findMergedTiles(before, after) {
    const merged = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (after[r][c] !== 0 && after[r][c] !== before[r][c]) {
                if (before[r][c] === after[r][c] / 2) {
                    merged.push({ r, c });
                }
            }
        }
    }
    return merged;
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

const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const maxTileEl = document.getElementById('max-tile');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreEl = document.getElementById('final-score');

// Render the grid to the DOM
function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            const inner = document.createElement('div');
            inner.className = 'tile-inner';
            const value = grid[r][c];
            if (value !== 0) {
                tile.classList.add(getTileClass(value));
                inner.textContent = value;
                // Animate new tiles
                if (newTilePos && newTilePos.r === r && newTilePos.c === c) {
                    tile.classList.add('tile-new');
                }
                // Animate merged tiles
                if (mergedPositions.some(p => p.r === r && p.c === c)) {
                    tile.classList.add('tile-merged');
                }
            }
            tile.appendChild(inner);
            boardEl.appendChild(tile);
        }
    }
}

function getTileClass(value) {
    if (value <= 8192) return 'tile-' + value;
    return 'tile-super';
}

function updateScoreboard() {
    scoreEl.textContent = score;
    if (score > bestScore) {
        bestScore = score;
        try {
            localStorage.setItem('2048-best-score', bestScore.toString());
        } catch (e) {}
    }
    bestScoreEl.textContent = bestScore;
    maxTileEl.textContent = maxTile;
    saveGame();
}

function showGameOver() {
    gameOverOverlay.classList.remove('hidden');
    finalScoreEl.textContent = '得分: ' + score;
    saveBestScore();
    clearSavedGame();
}

function hideGameOver() {
    gameOverOverlay.classList.add('hidden');
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    const keyMap = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right'
    };
    const direction = keyMap[e.key];
    if (direction) {
        e.preventDefault();
        move(direction);
    }
});

// Touch controls
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 30) return;

    if (absDx > absDy) {
        move(dx > 0 ? 'right' : 'left');
    } else {
        move(dy > 0 ? 'down' : 'up');
    }
}, { passive: true });

// Button handlers
document.getElementById('new-game-btn').addEventListener('click', () => {
    clearSavedGame();
    initGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    clearSavedGame();
    initGame();
});

document.getElementById('undo-btn').addEventListener('click', () => {
    alert('生活还在继续，请继续向前走吧！！');
});

loadBestScore();

if (loadGame()) {
    if (isGameOver()) {
        clearSavedGame();
        initGame();
    } else {
        updateScoreboard();
        render();
    }
} else {
    initGame();
}
