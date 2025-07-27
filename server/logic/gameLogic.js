// server/logic/gameLogic.js

// Define the dimensions of a standard Connect Four board
const NUM_ROWS = 6;
const NUM_COLS = 7;

// Helper to get the value at a specific row and column from the column-based board
// Returns null if out of bounds or if the spot is empty
function getCell(board, row, col) {
    if (col < 0 || col >= NUM_COLS || row < 0 || row >= NUM_ROWS) {
        return null; // Out of bounds
    }
    // board[col] gives the array for that column.
    // board[col][row] accesses the disk at that row (0-indexed from bottom).
    // If the row index is greater than or equal to the number of disks in the column, it's empty.
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
    for (let r = 3; r < NUM_ROWS; r++) { // Start from row 3 (0-indexed) to go down
        for (let c = 0; c < NUM_COLS - 3; c++) {
            if (getCell(board, r, c) === playerMarker &&
                getCell(board, r - 1, c + 1) === playerMarker &&
                getCell(board, r - 2, c + 2) === playerMarker &&
                getCell(board, r - 3, c + 3) === playerMarker) {
                return true;
            }
        }
    }

    return false; // No winner
}

// Check for a draw (board is full)
export function checkDraw(board) {
    for (let c = 0; c < NUM_COLS; c++) {
        // If any column is not full (i.e., its length is less than NUM_ROWS), it's not a draw
        if (board[c].length < NUM_ROWS) {
            return false; // Board is not full
        }
    }
    return true; // All columns are full, it's a draw
}