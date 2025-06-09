// 游戏配置
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

// 游戏状态
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameRunning = false;
let isPaused = false;
let dropTime = 0;
let dropInterval = 1000;

// Canvas 元素
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

// 俄罗斯方块形状定义
const PIECES = {
    I: {
        shape: [
            [1, 1, 1, 1]
        ],
        color: '#00f5ff'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#ffff00'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: '#800080'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: '#00ff00'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: '#ff0000'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        color: '#0000ff'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: '#ffa500'
    }
};

// 初始化游戏板
function initBoard() {
    board = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        board[y] = [];
        for (let x = 0; x < BOARD_WIDTH; x++) {
            board[y][x] = 0;
        }
    }
}

// 创建新方块
function createPiece() {
    const pieces = Object.keys(PIECES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    const pieceData = PIECES[randomPiece];
    
    return {
        shape: pieceData.shape,
        color: pieceData.color,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(pieceData.shape[0].length / 2),
        y: 0
    };
}

// 旋转方块
function rotatePiece(piece) {
    const rotated = [];
    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    
    for (let i = 0; i < cols; i++) {
        rotated[i] = [];
        for (let j = 0; j < rows; j++) {
            rotated[i][j] = piece.shape[rows - 1 - j][i];
        }
    }
    
    return {
        ...piece,
        shape: rotated
    };
}

// 检查碰撞
function isValidPosition(piece, offsetX = 0, offsetY = 0) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = piece.x + x + offsetX;
                const newY = piece.y + y + offsetY;
                
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return false;
                }
                
                if (newY >= 0 && board[newY][newX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

// 放置方块到游戏板
function placePiece(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardY = piece.y + y;
                const boardX = piece.x + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = piece.color;
                }
            }
        }
    }
}

// 清除完整的行
function clearLines() {
    let linesCleared = 0;
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(new Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++; // 重新检查当前行
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(50, 1000 - (level - 1) * 50);
        updateDisplay();
    }
}

// 绘制方块
function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// 绘制游戏板
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制已放置的方块
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x]) {
                drawBlock(ctx, x, y, board[y][x]);
            }
        }
    }
    
    // 绘制当前方块
    if (currentPiece) {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.color);
                }
            }
        }
    }
}

// 绘制下一个方块
function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (nextPiece) {
        const blockSize = 15;
        const offsetX = (nextCanvas.width - nextPiece.shape[0].length * blockSize) / 2;
        const offsetY = (nextCanvas.height - nextPiece.shape.length * blockSize) / 2;
        
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x]) {
                    nextCtx.fillStyle = nextPiece.color;
                    nextCtx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize,
                        blockSize
                    );
                    nextCtx.strokeStyle = '#000';
                    nextCtx.lineWidth = 1;
                    nextCtx.strokeRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize,
                        blockSize
                    );
                }
            }
        }
    }
}

// 更新显示
function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// 移动方块
function movePiece(dx, dy) {
    if (currentPiece && isValidPosition(currentPiece, dx, dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        return true;
    }
    return false;
}

// 旋转当前方块
function rotatePieceIfValid() {
    if (currentPiece) {
        const rotated = rotatePiece(currentPiece);
        if (isValidPosition(rotated)) {
            currentPiece = rotated;
        }
    }
}

// 硬降落
function hardDrop() {
    if (currentPiece) {
        while (movePiece(0, 1)) {
            score += 2;
        }
        updateDisplay();
    }
}

// 游戏循环
function gameLoop(timestamp) {
    if (!gameRunning || isPaused) {
        if (gameRunning) {
            requestAnimationFrame(gameLoop);
        }
        return;
    }
    
    if (timestamp - dropTime > dropInterval) {
        if (currentPiece) {
            if (!movePiece(0, 1)) {
                placePiece(currentPiece);
                clearLines();
                currentPiece = nextPiece;
                nextPiece = createPiece();
                
                if (!isValidPosition(currentPiece)) {
                    gameOver();
                    return;
                }
            }
        }
        dropTime = timestamp;
    }
    
    drawBoard();
    drawNextPiece();
    requestAnimationFrame(gameLoop);
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.add('show');
}

// 开始游戏
function startGame() {
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    isPaused = false;
    gameRunning = true;
    
    currentPiece = createPiece();
    nextPiece = createPiece();
    
    updateDisplay();
    document.getElementById('game-over').classList.remove('show');
    
    dropTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// 暂停/继续游戏
function togglePause() {
    if (gameRunning) {
        isPaused = !isPaused;
        if (!isPaused) {
            dropTime = performance.now();
            requestAnimationFrame(gameLoop);
        }
    }
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    if (!gameRunning || isPaused) {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePause();
        }
        return;
    }
    
    switch (e.code) {
        case 'ArrowLeft':
            e.preventDefault();
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            e.preventDefault();
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (movePiece(0, 1)) {
                score += 1;
                updateDisplay();
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotatePieceIfValid();
            break;
        case 'Space':
            e.preventDefault();
            togglePause();
            break;
    }
});

// 初始化游戏
startGame();