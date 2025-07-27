// server/logic/aiLogic.js (Basic AI - Can be improved with Minimax)

class ConnectFourAI {
    static getBestMove(board, botPlayerId, humanPlayerId) {
        const numRows = board.length;
        const numCols = board[0].length;

        const availableMoves = [];
        for (let col = 0; col < numCols; col++) {
            if (board[0][col] === null) { // Check if column is not full
                availableMoves.push(col);
            }
        }

        // 1. Check for immediate winning move for the bot
        for (const col of availableMoves) {
            const tempBoard = this._simulateMove(board, col, botPlayerId);
            if (this._checkWinForPlayer(tempBoard, botPlayerId)) {
                return col;
            }
        }

        // 2. Check for immediate blocking move (prevent human from winning)
        for (const col of availableMoves) {
            const tempBoard = this._simulateMove(board, col, humanPlayerId); // Simulate human's potential win
            if (this._checkWinForPlayer(tempBoard, humanPlayerId)) {
                return col;
            }
        }

        // 3. Otherwise, pick a random available move
        if (availableMoves.length > 0) {
            return availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }

        return null; // No available moves (should only happen if board is full, i.e., a draw)
    }

    // Helper to simulate a move without modifying the actual board
    static _simulateMove(board, column, playerMarker) {
        const newBoard = board.map(row => [...row]); // Deep copy
        for (let row = newBoard.length - 1; row >= 0; row--) {
            if (newBoard[row][column] === null) {
                newBoard[row][column] = playerMarker;
                return newBoard;
            }
        }
        return newBoard; // Column was full, return unchanged
    }

    // Helper to check for a win (similar to gameLogic.js but private to AI)
    static _checkWinForPlayer(board, playerMarker) {
        const numRows = board.length;
        const numCols = board[0].length;

        // Check horizontal
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols - 3; c++) {
                if (board[r][c] === playerMarker &&
                    board[r][c + 1] === playerMarker &&
                    board[r][c + 2] === playerMarker &&
                    board[r][c + 3] === playerMarker) {
                    return true;
                }
            }
        }

        // Check vertical
        for (let r = 0; r < numRows - 3; r++) {
            for (let c = 0; c < numCols; c++) {
                if (board[r][c] === playerMarker &&
                    board[r + 1][c] === playerMarker &&
                    board[r + 2][c] === playerMarker &&
                    board[r + 3][c] === playerMarker) {
                    return true;
                }
            }
        }

        // Check diagonal (top-left to bottom-right)
        for (let r = 0; r < numRows - 3; r++) {
            for (let c = 0; c < numCols - 3; c++) {
                if (board[r][c] === playerMarker &&
                    board[r + 1][c + 1] === playerMarker &&
                    board[r + 2][c + 2] === playerMarker &&
                    board[r + 3][c + 3] === playerMarker) {
                    return true;
                }
            }
        }

        // Check diagonal (top-right to bottom-left)
        for (let r = 3; r < numRows; r++) {
            for (let c = 0; c < numCols - 3; c++) {
                if (board[r][c] === playerMarker &&
                    board[r - 1][c + 1] === playerMarker &&
                    board[r - 2][c + 2] === playerMarker &&
                    board[r - 3][c + 3] === playerMarker) {
                    return true;
                }
            }
        }
        return false;
    }
}

export { ConnectFourAI };