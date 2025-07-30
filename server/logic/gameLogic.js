// server/logic/gameLogic.js

const NUM_ROWS = 6;
const NUM_COLS = 7;

function getCell(board, row, col) {
    if (col < 0 || col >= NUM_COLS || row < 0 || row >= NUM_ROWS) {
        return null; 
    }
    return board[col][row] || null;
}

// Check for a win
export function checkWin(board, playerMarker) {
    // Check horizontal wins
    for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < NUM_COLS - 3; c++) {
            if (getCell(board, r, c) === playerMarker &&
                getCell(board, r, c + 1) === playerMarker &&
                getCell(board, r, c + 2) === playerMarker &&
                getCell(board, r, c + 3) === playerMarker) {
                return true;
            }
        }
    }

    // Check vertical wins
    for (let r = 0; r < NUM_ROWS - 3; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
            if (getCell(board, r, c) === playerMarker &&
                getCell(board, r + 1, c) === playerMarker &&
                getCell(board, r + 2, c) === playerMarker &&
                getCell(board, r + 3, c) === playerMarker) {
                return true;
            }
        }
    }

    // Check diagonal wins (top-left to bottom-right)
    for (let r = 0; r < NUM_ROWS - 3; r++) {
        for (let c = 0; c < NUM_COLS - 3; c++) {
            if (getCell(board, r, c) === playerMarker &&
                getCell(board, r + 1, c + 1) === playerMarker &&
                getCell(board, r + 2, c + 2) === playerMarker &&
                getCell(board, r + 3, c + 3) === playerMarker) {
                return true;
            }
        }
    }

    // Check diagonal wins (top-right to bottom-left)
    for (let r = 3; r < NUM_ROWS; r++) { 
        for (let c = 0; c < NUM_COLS - 3; c++) {
            if (getCell(board, r, c) === playerMarker &&
                getCell(board, r - 1, c + 1) === playerMarker &&
                getCell(board, r - 2, c + 2) === playerMarker &&
                getCell(board, r - 3, c + 3) === playerMarker) {
                return true;
            }
        }
    }

    return false; 
}

export function checkDraw(board) {
    for (let c = 0; c < NUM_COLS; c++) {
        if (board[c].length < NUM_ROWS) {
            return false; 
        }
    }
    return true; 
}