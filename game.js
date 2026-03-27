        // Game variables
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const nextCanvas1 = document.getElementById('nextCanvas1');
        const nextCtx1 = nextCanvas1.getContext('2d');
        const nextCanvas2 = document.getElementById('nextCanvas2');
        const nextCtx2 = nextCanvas2.getContext('2d');
        
        // Set pixelated rendering for all canvas contexts
        ctx.imageSmoothingEnabled = false;
        nextCtx1.imageSmoothingEnabled = false;
        nextCtx2.imageSmoothingEnabled = false;
        const blockSize = 20;
        const boardWidth = 10;
        const boardHeight = 12;
        const previewBlockSize = 8;
        
        let board = [];
        let currentPiece = null;
        let nextPiece1 = null;
        let nextPiece2 = null;
        let currentX = 0;
        let currentY = 0;
        let score = 0;
        let lines = 0;
        let level = 1;
        let gameRunning = false;
        let gamePaused = false;
        let dropTime = 0;
        let dropInterval = 1000; // milliseconds
        let instructionPart = 1; // Track which instruction part is showing

        // Tetris pieces (I, O, T, S, Z, J, L)
        const pieces = [
            // I piece
            [
                [1, 1, 1, 1]
            ],
            // O piece
            [
                [1, 1],
                [1, 1]
            ],
            // T piece
            [
                [0, 1, 0],
                [1, 1, 1]
            ],
            // S piece
            [
                [0, 1, 1],
                [1, 1, 0]
            ],
            // Z piece
            [
                [1, 1, 0],
                [0, 1, 1]
            ],
            // J piece
            [
                [1, 0, 0],
                [1, 1, 1]
            ],
            // L piece
            [
                [0, 0, 1],
                [1, 1, 1]
            ]
        ];

        // Initialize game board
        function initBoard() {
            board = [];
            for (let y = 0; y < boardHeight; y++) {
                board[y] = [];
                for (let x = 0; x < boardWidth; x++) {
                    board[y][x] = 0;
                }
            }
        }

        // Get random piece
        function getRandomPiece() {
            const pieceIndex = Math.floor(Math.random() * pieces.length);
            return pieces[pieceIndex];
        }

        // Rotate piece 90 degrees clockwise
        function rotatePiece(piece) {
            const rotated = [];
            const rows = piece.length;
            const cols = piece[0].length;
            
            for (let i = 0; i < cols; i++) {
                rotated[i] = [];
                for (let j = 0; j < rows; j++) {
                    rotated[i][j] = piece[rows - 1 - j][i];
                }
            }
            return rotated;
        }

        // Check if piece can be placed at position
        function canPlacePiece(piece, x, y) {
            for (let py = 0; py < piece.length; py++) {
                for (let px = 0; px < piece[py].length; px++) {
                    if (piece[py][px]) {
                        const newX = x + px;
                        const newY = y + py;
                        
                        // Check boundaries
                        if (newX < 0 || newX > boardWidth - 1 || newY >= boardHeight) {
                            return false;
                        }
                        
                        // Check collision with existing blocks
                        if (newY >= 0 && board[newY][newX]) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        // Place piece on board
        function placePiece(piece, x, y) {
            for (let py = 0; py < piece.length; py++) {
                for (let px = 0; px < piece[py].length; px++) {
                    if (piece[py][px]) {
                        const newX = x + px;
                        const newY = y + py;
                        if (newY >= 0) {
                            board[newY][newX] = 1;
                        }
                    }
                }
            }
        }

        // Clear completed lines
        function clearLines() {
            let linesCleared = 0;
            for (let y = boardHeight - 1; y >= 0; y--) {
                if (board[y].every(cell => cell === 1)) {
                    board.splice(y, 1);
                    board.unshift(new Array(boardWidth).fill(0));
                    linesCleared++;
                    y++; // Check the same line again
                }
            }
            
            if (linesCleared > 0) {
                lines += linesCleared;
                score += linesCleared * 100 * level;
                level = Math.floor(lines / 10) + 1;
                dropInterval = Math.max(100, 1000 - (level - 1) * 100);
                updateScore();
            }
        }

        // Update score display
        function updateScore() {
            updateScoreboard();
        }

        // Update preview canvases
        function updatePreviews() {
            drawPreviewPiece(nextCtx1, nextPiece1);
            drawPreviewPiece(nextCtx2, nextPiece2);
        }

        // Update scoreboard
        function updateScoreboard() {
            document.getElementById('scoreboardScore').textContent = score;
            document.getElementById('scoreboardLines').textContent = lines;
            document.getElementById('scoreboardLevel').textContent = level;
        }

        // Spawn new piece
        function spawnPiece() {
            // Move next pieces forward
            currentPiece = nextPiece1;
            nextPiece1 = nextPiece2;
            nextPiece2 = getRandomPiece();
            
            // If this is the first piece, get initial pieces
            if (!currentPiece) {
                currentPiece = getRandomPiece();
                nextPiece1 = getRandomPiece();
                nextPiece2 = getRandomPiece();
            }
            
            currentX = Math.floor(boardWidth / 2) - Math.floor(currentPiece[0].length / 2);
            currentY = 0;
            
            // Check if game over
            if (!canPlacePiece(currentPiece, currentX, currentY)) {
                gameOver();
                return;
            }
            
            // Update previews
            updatePreviews();
        }

        // Move piece
        function movePiece(dx, dy) {
            if (canPlacePiece(currentPiece, currentX + dx, currentY + dy)) {
                currentX += dx;
                currentY += dy;
                return true;
            }
            return false;
        }

        // Rotate current piece
        function rotateCurrentPiece() {
            const rotated = rotatePiece(currentPiece);
            if (canPlacePiece(rotated, currentX, currentY)) {
                currentPiece = rotated;
            }
        }

        // Drop piece down
        function dropPiece() {
            if (!movePiece(0, 1)) {
                placePiece(currentPiece, currentX, currentY);
                clearLines();
                spawnPiece();
            }
        }

        // Instant drop piece to bottom
        function instantDrop() {
            if (!currentPiece) return;
            
            // Move piece down as far as possible
            while (movePiece(0, 1)) {
                // Keep moving down until it can't move anymore
            }
            
            // Place the piece and continue game
            placePiece(currentPiece, currentX, currentY);
            clearLines();
            spawnPiece();
        }

        // Draw block
        function drawBlock(x, y, filled = true) {
            const pixelX = x * blockSize;
            const pixelY = y * blockSize;
            
            if (filled) {
                // Draw neon green outline first
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 3;
                ctx.strokeRect(pixelX, pixelY, blockSize, blockSize);
                
                // Reset shadow
                ctx.shadowBlur = 0;
                
                // Draw filled block with tile color
                ctx.fillStyle = '#081820';
                ctx.fillRect(pixelX, pixelY, blockSize, blockSize);
                ctx.strokeStyle = '#272929';
                ctx.lineWidth = 1;
                ctx.strokeRect(pixelX, pixelY, blockSize, blockSize);
            } else {
                // Draw empty block with display background
                ctx.fillStyle = '#346856';
                ctx.fillRect(pixelX, pixelY, blockSize, blockSize);
            }
        }

        // Draw preview block
        function drawPreviewBlock(ctx, x, y, filled = true) {
            const pixelX = x * previewBlockSize;
            const pixelY = y * previewBlockSize;
            
            if (filled) {
                // Draw neon green outline first
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 1;
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 2;
                ctx.strokeRect(pixelX, pixelY, previewBlockSize, previewBlockSize);
                
                // Reset shadow
                ctx.shadowBlur = 0;
                
                ctx.fillStyle = '#081820';
                ctx.fillRect(pixelX, pixelY, previewBlockSize, previewBlockSize);
                ctx.strokeStyle = '#272929';
                ctx.lineWidth = 1;
                ctx.strokeRect(pixelX, pixelY, previewBlockSize, previewBlockSize);
            } else {
                ctx.fillStyle = '#346856';
                ctx.fillRect(pixelX, pixelY, previewBlockSize, previewBlockSize);
            }
        }

        // Draw piece in preview
        function drawPreviewPiece(ctx, piece) {
            // Clear canvas
            ctx.fillStyle = '#346856';
            ctx.fillRect(0, 0, 40, 40);
            
            if (!piece) return;
            
            // Center the piece in the preview
            const pieceWidth = piece[0].length;
            const pieceHeight = piece.length;
            const startX = Math.floor((5 - pieceWidth) / 2);
            const startY = Math.floor((5 - pieceHeight) / 2);
            
            for (let py = 0; py < piece.length; py++) {
                for (let px = 0; px < piece[py].length; px++) {
                    if (piece[py][px]) {
                        drawPreviewBlock(ctx, startX + px, startY + py, true);
                    }
                }
            }
        }

        // Draw board
        function drawBoard() {
            for (let y = 0; y < boardHeight; y++) {
                for (let x = 0; x < boardWidth; x++) {
                    drawBlock(x, y, board[y][x] === 1);
                }
            }
        }

        // Draw current piece
        function drawCurrentPiece() {
            if (currentPiece) {
                for (let py = 0; py < currentPiece.length; py++) {
                    for (let px = 0; px < currentPiece[py].length; px++) {
                        if (currentPiece[py][px]) {
                            const x = currentX + px;
                            const y = currentY + py;
                            if (y >= 0) {
                                drawBlock(x, y, true);
                            }
                        }
                    }
                }
            }
        }

        // Game over
        function gameOver() {
            gameRunning = false;
            // Update final stats
            updateFinalStats();
            // Clear the canvas to black
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Switch back to menu screen and show game over
            setTimeout(() => {
                document.getElementById('gameScreen').style.display = 'none';
                document.getElementById('mainScreen').style.display = 'block';
                document.getElementById('startScreen').style.display = 'none';
                document.getElementById('instructionsScreen').style.display = 'none';
                document.getElementById('gameOver').style.display = 'block';
                document.getElementById('secondScreen').style.display = 'flex';
            }, 500);
        }

        // Update final stats for game over screen
        function updateFinalStats() {
            document.getElementById('finalScore').textContent = score;
            document.getElementById('finalLines').textContent = lines;
            document.getElementById('finalLevel').textContent = level;
        }


        // Show instructions
        function showInstructions() {
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('instructionsScreen').style.display = 'block';
            document.getElementById('secondScreen').style.display = 'flex';
            instructionPart = 1;
            showInstructionPart(1);
        }

        // Show specific instruction part
        function showInstructionPart(part) {
            document.getElementById('instructionsPart1').classList.remove('active');
            document.getElementById('instructionsPart2').classList.remove('active');
            document.getElementById('instructionsPart' + part).classList.add('active');
            instructionPart = part;
        }

        // Next instruction part
        function nextInstructionPart() {
            if (instructionPart === 1) {
                showInstructionPart(2);
            }
        }

        // Pause game
        function pauseGame() {
            if (gameRunning && !gamePaused) {
                gamePaused = true;
                // Show pause overlay
                showPauseOverlay();
            }
        }

        // Resume game
        function resumeGame() {
            if (gameRunning && gamePaused) {
                gamePaused = false;
                // Hide pause overlay
                hidePauseOverlay();
            }
        }

        // Show pause overlay
        function showPauseOverlay() {
            const pauseOverlay = document.getElementById('pauseOverlay');
            if (pauseOverlay) {
                pauseOverlay.style.display = 'block';
            }
        }

        // Hide pause overlay
        function hidePauseOverlay() {
            const pauseOverlay = document.getElementById('pauseOverlay');
            if (pauseOverlay) {
                pauseOverlay.style.display = 'none';
            }
        }

        // Start game
        function startGame() {
            initBoard();
            score = 0;
            lines = 0;
            level = 1;
            dropInterval = 1000;
            gameRunning = true;
            gamePaused = false;
            
            // Switch to game screen
            document.getElementById('mainScreen').style.display = 'none';
            document.getElementById('gameScreen').style.display = 'flex';
            document.getElementById('secondScreen').style.display = 'flex';
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('instructionsScreen').style.display = 'none';
            document.getElementById('gameOver').style.display = 'none';
            hidePauseOverlay();
            updateScore();
            
            // Initialize preview pieces
            nextPiece1 = getRandomPiece();
            nextPiece2 = getRandomPiece();
            updatePreviews();
            
            spawnPiece();
            
            // Start the game loop
            requestAnimationFrame(gameLoop);
        }

        // Game loop
        function gameLoop(timestamp) {
            if (gameRunning && !gamePaused) {
                // Clear canvas with display background color
                ctx.fillStyle = '#346856';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw board
                drawBoard();
                
                // Draw current piece
                drawCurrentPiece();
                
                // Auto drop
                if (timestamp - dropTime > dropInterval) {
                    dropPiece();
                    dropTime = timestamp;
                }
            }
            
            // Continue the game loop (even when paused to maintain timing)
            requestAnimationFrame(gameLoop);
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            const startScreen = document.getElementById('startScreen');
            const instructionsScreen = document.getElementById('instructionsScreen');
            
            // Handle Enter key for instruction navigation
            if (e.key === 'Enter') {
                if (instructionsScreen.style.display !== 'none' && instructionPart === 1) {
                    nextInstructionPart();
                }
                return;
            }
            
            if (e.key.toLowerCase() === 'r') {
                if (startScreen.style.display !== 'none') {
                    // On start screen, show instructions
                    showInstructions();
                } else if (instructionsScreen.style.display !== 'none' || !gameRunning) {
                    // On instructions screen or game over, start game
                    startGame();
                }
                return;
            }
            
            if (!gameRunning) {
                return;
            }
            
            switch(e.key.toLowerCase()) {
                case 'escape':
                    e.preventDefault();
                    if (gamePaused) {
                        resumeGame();
                    } else {
                        pauseGame();
                    }
                    break;
                case 'r':
                    // Restart game while playing
                    startGame();
                    break;
                case ' ':
                    e.preventDefault(); // Prevent page scroll
                    if (!gamePaused) {
                        instantDrop();
                    }
                    break;
                case 'w':
                    if (!gamePaused) {
                        rotateCurrentPiece();
                    }
                    break;
                case 'a':
                    if (!gamePaused) {
                    movePiece(-1, 0);
                    }
                    break;
                case 's':
                    if (!gamePaused) {
                    movePiece(0, 1);
                    }
                    break;
                case 'd':
                    if (!gamePaused) {
                    movePiece(1, 0);
                    }
                    break;
            }
        });

        // D-Pad Controls
        document.getElementById('dpadUp').addEventListener('click', () => {
            if (gameRunning && !gamePaused) {
                rotateCurrentPiece();
            }
        });

        document.getElementById('dpadLeft').addEventListener('click', () => {
            if (gameRunning && !gamePaused) {
                movePiece(-1, 0);
            }
        });

        document.getElementById('dpadRight').addEventListener('click', () => {
            if (gameRunning && !gamePaused) {
                movePiece(1, 0);
            }
        });

        document.getElementById('dpadDown').addEventListener('click', () => {
            if (gameRunning && !gamePaused) {
                movePiece(0, 1);
            }
        });

        document.getElementById('dpadCenter').addEventListener('click', () => {
            const startScreen = document.getElementById('startScreen');
            const instructionsScreen = document.getElementById('instructionsScreen');
            
            if (startScreen.style.display !== 'none') {
                // On start screen, show instructions
                showInstructions();
            } else if (instructionsScreen.style.display !== 'none') {
                // On instructions screen, navigate through instructions
                if (instructionPart === 1) {
                    nextInstructionPart();
                } else {
                    // Go back to start screen instead of starting game
                    document.getElementById('instructionsScreen').style.display = 'none';
                    document.getElementById('startScreen').style.display = 'block';
                }
            } else if (gameRunning && !gamePaused) {
                // During gameplay - instant drop
                instantDrop();
            }
        });

        // Touch events for mobile devices
        document.getElementById('dpadUp').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameRunning && !gamePaused) {
                rotateCurrentPiece();
            }
        });

        document.getElementById('dpadLeft').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameRunning && !gamePaused) {
                movePiece(-1, 0);
            }
        });

        document.getElementById('dpadRight').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameRunning && !gamePaused) {
                movePiece(1, 0);
            }
        });

        document.getElementById('dpadDown').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameRunning && !gamePaused) {
                movePiece(0, 1);
            }
        });

        document.getElementById('dpadCenter').addEventListener('touchstart', (e) => {
            e.preventDefault();
            const startScreen = document.getElementById('startScreen');
            const instructionsScreen = document.getElementById('instructionsScreen');
            
            if (startScreen.style.display !== 'none') {
                showInstructions();
            } else if (instructionsScreen.style.display !== 'none') {
                if (instructionPart === 1) {
                    nextInstructionPart();
                } else {
                    // Go back to start screen instead of starting game
                    document.getElementById('instructionsScreen').style.display = 'none';
                    document.getElementById('startScreen').style.display = 'block';
                }
            } else if (gameRunning && !gamePaused) {
                // During gameplay - instant drop
                instantDrop();
            }
        });

        // Mobile Action Buttons
        document.getElementById('mobileStart').addEventListener('click', () => {
            const startScreen = document.getElementById('startScreen');
            const instructionsScreen = document.getElementById('instructionsScreen');
            
            if (startScreen.style.display !== 'none') {
                // On start screen, show instructions
                showInstructions();
            } else if (instructionsScreen.style.display !== 'none') {
                // On instructions screen, start the game
                startGame();
            } else if (gameRunning) {
                // Game is running - quick restart
                if (gamePaused) {
                    // If paused, resume first then restart
                    resumeGame();
                }
                startGame();
            } else {
                // Game not running - start new game
                startGame();
            }
        });

        document.getElementById('mobileMenu').addEventListener('click', () => {
            if (gameRunning) {
                if (gamePaused) {
                    resumeGame();
                } else {
                    pauseGame();
                }
            } else {
                // If not running, restart the game
                startGame();
            }
        });

        // Touch events for mobile buttons
        document.getElementById('mobileStart').addEventListener('touchstart', (e) => {
            e.preventDefault();
            const startScreen = document.getElementById('startScreen');
            const instructionsScreen = document.getElementById('instructionsScreen');
            
            if (startScreen.style.display !== 'none') {
                // On start screen, show instructions
                showInstructions();
            } else if (instructionsScreen.style.display !== 'none') {
                // On instructions screen, start the game
                startGame();
            } else if (gameRunning) {
                // Game is running - quick restart
                if (gamePaused) {
                    // If paused, resume first then restart
                    resumeGame();
                }
                startGame();
            } else {
                // Game not running - start new game
                startGame();
            }
        });

        document.getElementById('mobileMenu').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameRunning) {
                if (gamePaused) {
                    resumeGame();
                } else {
                    pauseGame();
                }
            } else {
                startGame();
            }
        });

        // Game loop will be started when the game begins
