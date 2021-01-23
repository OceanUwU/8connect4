const Game = require('./Game');

var board;
let w = 7;
let h = 6;
let scores = {
    1: 100000,
    2: -100000,
};
var player = 1;

function nextSpace(b, x) { //finds the next space (from the bottom)
    for (y = h - 1; y >= 0; y--){
        if (b[y][x] == 0) {
            return y;
        }
    }
    return -1;
}

function generateMove(boards, player, difficulty) {
    boards = JSON.parse(JSON.stringify(boards.map(board => board.state)).replace(new RegExp(`"${player}"`, 'g'), '1').replace(new RegExp(`"${player == 'a' ? 'b' : 'a'}"`, 'g'), '2').replace(new RegExp('null', 'g'), '0')); //deep clone of boards
    // AI to make its turn
    let bestScore = -Infinity;
    let move;
    let tempI;

    for (let j = 0; j < boards[0][0].length; j++) {
        let rows = boards.map(b => nextSpace(b, j)); //get the row the token will fall for each board
        if (rows.some(row => row != -1)) { //if there is at least one board where this column is available
            let score = 0;
            for (let i in boards) {
                if (rows[i] == -1) //if this column is not available in this board
                    continue; //go to the next board
                board = boards[i];
                board[rows[i]][j] = 1;
                score += minimax(difficulty, false, 1);
                board[rows[i]][j] = 0;
            }

            if (score > bestScore || (score == bestScore && Math.random() > 0.3)) {
                bestScore = score;
                move = j;
            }
        }
    }

    return move;
}

function score_position(player, player2, nr_moves) {
    let score = 0

    for (i = 1; i < h; i++) {
        for (j = 1; j < w; j++) {
            if ((countPieces(i, j, i + 4, j, player) == 3 && countPieces(i, j, i + 4, j, 0) == 1) || (countPieces(i, j, i, j + 4, player) == 3 && countPieces(i, j, i, j + 4, 0) == 1) ||
                (countDiagonal(i, j, 0, player) == 3 && countDiagonal(i, j, 1, 0) == 1)) {
                score += 1000;
            }

            if ((countPieces(i, j, i + 4, j, player) == 2 && countPieces(i, j, i + 4, j, 0) == 2) || (countPieces(i, j, i, j + 4, player) == 2 && countPieces(i, j, i, j + 4, 0) == 2) ||
                (countDiagonal(i, j, 0, player) == 2 && countDiagonal(i, j, 1, 0) == 2)) {
                score += 10;
            }

            if ((countPieces(i, j, i + 4, j, player) == 1 && countPieces(i, j, i + 4, j, 0) == 3) || (countPieces(i, j, i, j + 4, player) == 1 && countPieces(i, j, i, j + 4, 0) == 3) ||
                (countDiagonal(i, j, 0, player) == 1 && countDiagonal(i, j, 1, 0) == 3)) {
                score += 1;
            }

            if ((countPieces(i, j, i + 4, j, player2) == 3 && countPieces(i, j, i + 4, j, 0) == 1) || (countPieces(i, j, i, j + 4, player2) == 3 && countPieces(i, j, i, j + 4, 0) == 1) ||
                (countDiagonal(i, j, 0, player2) == 3 && countDiagonal(i, j, 1, 0) == 1)) {
                score -= 1000;
            }

            if ((countPieces(i, j, i + 4, j, player2) == 2 && countPieces(i, j, i + 4, j, 0) == 2) || (countPieces(i, j, i, j + 4, player2) == 2 && countPieces(i, j, i, j + 4, 0) == 2) ||
                (countDiagonal(i, j, 0, player2) == 2 && countDiagonal(i, j, 1, 0) == 2)) {
                score -= 10;
            }

            if ((countPieces(i, j, i + 4, j, player2) == 1 && countPieces(i, j, i + 4, j, 0) == 3) || (countPieces(i, j, i, j + 4, player2) == 1 && countPieces(i, j, i, j + 4, 0) == 3) ||
                (countDiagonal(i, j, 0, player2) == 1 && countDiagonal(i, j, 1, 0) == 3)) {
                score -= 1;
            }
        }
    }

    return score
}

function countPieces(i, j, i2, j2, player) {
    let pieces = 0;

    for (i; i < i2; i++) {
        for (j; j < j2; j++) {
            if (board[i][j] == player) {
                pieces += 1;
            }
        }
    }
    return pieces;
}

function countDiagonal(i, j, direction, player) {
    let pieces = 0;

    for (x = 0; x < 4; x++) {
        if (direction == 1) {
            if (i + x < h && j + x < w) {
                if (board[i + x][j + x] == player) {
                    pieces += 1;
                }
            }
        } else {
            if (i + x < h && j - x < w && j - x > 0) {
                if (board[i + x][j - x] == player) {
                    pieces += 1;
                }
            }
        }
    }
    return pieces;
}

function p(y, x) {
    return (y < 0 || x < 0 || y >= h || x >= w) ? 0 : board[y][x];
}

function getWinner() { //loops through rows, columns, diagonals, etc for win condition
    for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
            if (p(y, x) != 0 && p(y, x) == p(y, x + 1) && p(y, x) == p(y, x + 2) && p(y, x) == p(y, x + 3)) {
                return p(y, x);
            }
    
            if (p(y, x) != 0 && p(y, x) == p(y + 1, x) && p(y, x) == p(y + 2, x) && p(y, x) == p(y + 3, x)) {
                return p(y, x);
            }
    
            for (d = -1; d <= 1; d += 2) {
                if (p(y, x) != 0 && p(y, x) == p(y + 1 * d, x + 1) && p(y, x) == p(y + 2 * d, x + 2) && p(y, x) == p(y + 3 * d, x + 3)) {
                    return p(y, x);
                }
            }
        }
    }

    for (y = 0; y < h; y++)
        for (x = 0; x < w; x++)
            if (p(y, x) == 0) return 0;
    return -1; //tie
}
  

function minimax(depth, isMaximizing, nr_moves) {
    let result = getWinner();
    if (result > 0) {
        return scores[result] - 20 * nr_moves;
    }

    if (result == -1) {
        return 0 - 50 * nr_moves;
    }

    if (depth == 0) {
        return score_position(1, 2, nr_moves);
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let j = 0; j < w; j++) {
            let tempI = nextSpace(board, j);
            if (tempI < h && tempI > -1) {
                board[tempI][j] = 1;
                let score = minimax(depth - 1, false, nr_moves + 1);
                board[tempI][j] = 0;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let j = 0; j < w; j++) {
            // Is the spot available?
            let tempI = nextSpace(board, j)
            if (tempI < h && tempI > -1) {
                board[tempI][j] = 2;
                let score = minimax(depth - 1, true, nr_moves + 1);
                board[tempI][j] = 0;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

module.exports = generateMove;