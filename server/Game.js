const { io } = require('./');

const boardHeight = 6;
const boardWidth = 7;

function checkLine(a,b,c,d) {
    // Check first cell non-zero and all cells match
    return ((a !== null) && (a === b) && (a === c) && (a === d));
}

class Game {
    constructor(id, players, match) {
        this.id = id;
        this.outcome = null;
        this.players = players;
        this.state = [];
        this.match = match;
        for (let y = 0; y < boardHeight; y++) {
            let column = [];
            for (let x = 0; x < boardWidth; x++) {
                column.push(null);
            }
            this.state.push(column);
        }
    }

    static whereFall(state, column) {
        let row = null;
        for (let i = 0; i < boardHeight; i++) {
            if (state[i][column] != null) {
                row = i - 1;
                break;
            }
        }
        if (row == -1) //if the top slot was full
            row = null; //this column is full
        else if (row == null) //if all the slots were empty
            row = boardHeight - 1; //use the bottom slot
        return row;
    }

    move(column, player, colour) { //will return true if a move was successfully made, false otherwise
        //if this game has ended, block the move
        if (this.outcome !== null)
            return false;
        
        if (this.players[colour] != player)
            return false;

        let row = Game.whereFall(this.state, column);
        if (row == null) //if the top slot was full
            return false; //move is invalid on this board

        this.state[row][column] = colour; //fill the chosen slot with the player's colour
        io.to(this.match.code).emit('move', this.id, this.match.turn, row, column); //tell the clients about this move

        
        let outcome = Game.getOutcome(this.state); //check if game has now ended
        if (outcome !== null) { //if it has
            this.outcome = outcome; //mark the game as done
            io.to(this.match.code).emit('outcomeDecided', this.id, outcome); //tell the clients about the outcome
        }


        return true;
    }

    static getOutcome(state) {
        //Check down
        for (let r = 0; r < 3; r++)
            for (let c = 0; c < 7; c++)
                if (checkLine(state[r][c], state[r+1][c], state[r+2][c], state[r+3][c]))
                    return state[r][c];
    
        //Check right
        for (let r = 0; r < 6; r++)
            for (let c = 0; c < 4; c++)
                if (checkLine(state[r][c], state[r][c+1], state[r][c+2], state[r][c+3]))
                    return state[r][c];
    
        //Check down-right
        for (let r = 0; r < 3; r++)
            for (let c = 0; c < 4; c++)
                if (checkLine(state[r][c], state[r+1][c+1], state[r+2][c+2], state[r+3][c+3]))
                    return state[r][c];
    
        //Check down-left
        for (let r = 3; r < 6; r++)
            for (let c = 0; c < 4; c++)
                if (checkLine(state[r][c], state[r-1][c+1], state[r-2][c+2], state[r-3][c+3]))
                    return state[r][c];

        //Check if draw
        let isDraw = true;
        for (let column of state)
            if (column.includes(null)) {
                isDraw = false;
                break;
            }
        if (isDraw)
            return false;

        //Game has not ended
        return null;
    }
}

module.exports = Game;