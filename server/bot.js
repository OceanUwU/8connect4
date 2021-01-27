const Game = require('./Game');


let scores = {
    1: 100000,
    2: -100000,
};

function nextSpace(b, x) { //finds the next space (from the bottom)
    for (y = b.length - 1; y >= 0; y--){
        if (b[y][x] == 0) {
            return y;
        }
    }
    return -1;
}

function generateMove(boards, player, difficulty, lineLength) {
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
                score += minimax(board, lineLength, difficulty, false, 1);
                board[rows[i]][j] = 0;
            }

            if (score > bestScore || (score == bestScore && Math.random() < 0.3)) {
                bestScore = score;
                move = j;
            }
        }
    }

    return move;
}

const positionScores = [1000, 10, 1, 0.1, 0.01, 0.001, 0.0001];
function score_position(board, lineLength, player, player2, nr_moves) {
    let score = 0

    for (i = 1; i < board.length; i++) {
        for (j = 1; j < board[0].length; j++) {
            for (let i = lineLength - 1; i > 0; i--) {
                if ((countPieces(board, i, j, i + 4, j, player) == i && countPieces(board, i, j, i + 4, j, 0) == lineLength - i) || (countPieces(board, i, j, i, j + 4, player) == i && countPieces(board, i, j, i, j + 4, 0) == lineLength - i) ||
                    (countDiagonal(board, lineLength, i, j, 0, player) == i && countDiagonal(board, lineLength, i, j, 1, 0) == lineLength - i)) {
                    score += positionScores[lineLength - i];
                }
                if ((countPieces(board, i, j, i + 4, j, player2) == i && countPieces(board, i, j, i + 4, j, 0) == lineLength - i) || (countPieces(board, i, j, i, j + 4, player2) == i && countPieces(board, i, j, i, j + 4, 0) == lineLength - i) ||
                    (countDiagonal(board, lineLength, i, j, 0, player2) == i && countDiagonal(board, lineLength, i, j, 1, 0) == lineLength - i)) {
                    score -= positionScores[lineLength - i];
                }
            }
        }
    }

    return score
}

function countPieces(board, i, j, i2, j2, player) {
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

function countDiagonal(board, lineLength, i, j, direction, player) {
    let pieces = 0;

    for (x = 0; x < lineLength; x++) {
        if (direction == 1) {
            if (i + x < board.length && j + x < board[0].length) {
                if (board[i + x][j + x] == player) {
                    pieces += 1;
                }
            }
        } else {
            if (i + x < board.length && j - x < board[0].length && j - x > 0) {
                if (board[i + x][j - x] == player) {
                    pieces += 1;
                }
            }
        }
    }
    return pieces;
}

function checkLine(board, lineLength, r, c, rD, cD) {
    let toCheck = board[r][c];
    if (toCheck === 0) return false;
    let checking = [];
    for (let i = 1; i < lineLength; i++)
        checking.push(board[r + (i * rD)][c + (i * cD)]);
    return checking.every(t => t === toCheck);
}

function getWinner(board, lineLength) {
    //Check down
    for (let r = 0; r <= board.length - lineLength; r++)
        for (let c = 0; c < board[0].length; c++)
            if (checkLine(board, lineLength, r, c, 1, 0))
                return board[r][c];

    //Check right
    for (let r = 0; r < board.length; r++)
        for (let c = 0; c <= board[0].length - lineLength; c++)
            if (checkLine(board, lineLength, r, c, 0, 1))
                    return board[r][c];

    //Check down-right
    for (let r = 0; r <= board.length - lineLength; r++)
        for (let c = 0; c <= board[0].length - lineLength; c++)
        if (checkLine(board, lineLength, r, c, 1, 1))
                return board[r][c];

    //Check down-left
    for (let r = board.length - (board.length - lineLength + 1); r < board.length; r++)
        for (let c = 0; c <= board[0].length - lineLength; c++)
            if (checkLine(board, lineLength, r, c, -1, 1))
                    return board[r][c];

    //Check if draw
    let isDraw = true;
    for (let row of board)
        if (row.includes(0)) {
            isDraw = false;
            break;
        }
    if (isDraw)
        return -1;

    //Game has not ended
    return 0;
}
  

function minimax(board, lineLength, depth, isMaximizing, nr_moves) {
    let result = getWinner(board, lineLength);
    if (result > 0) {
        return scores[result] - 20 * nr_moves;
    }

    if (result == -1) {
        return 0 - 50 * nr_moves;
    }

    if (depth == 0) {
        return score_position(board, lineLength, 1, 2, nr_moves);
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let j = 0; j < board[0].length; j++) {
            let tempI = nextSpace(board, j);
            if (tempI < board.length && tempI > -1) {
                board[tempI][j] = 1;
                let score = minimax(board, lineLength, depth - 1, false, nr_moves + 1);
                board[tempI][j] = 0;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let j = 0; j < board[0].length; j++) {
            // Is the spot available?
            let tempI = nextSpace(board, j)
            if (tempI < board.length && tempI > -1) {
                board[tempI][j] = 2;
                let score = minimax(board, lineLength, depth - 1, true, nr_moves + 1);
                board[tempI][j] = 0;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

module.exports = generateMove;