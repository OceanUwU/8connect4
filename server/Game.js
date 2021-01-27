const { io } = require('./');

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
        for (let y = 0; y < this.match.rows; y++) {
            let column = [];
            for (let x = 0; x < this.match.columns; x++) {
                column.push(null);
            }
            this.state.push(column);
        }
    }

    whereFall(column) {
        let row = null;
        for (let i = 0; i < this.match.rows; i++) {
            if (this.state[i][column] != null) {
                row = i - 1;
                break;
            }
        }
        if (row == -1) //if the top slot was full
            row = null; //this column is full
        else if (row == null) //if all the slots were empty
            row = this.match.rows - 1; //use the bottom slot
        return row;
    }

    move(column, player, colour) { //will return true if a move was successfully made, false otherwise
        //if this game has ended, block the move
        if (this.outcome !== null)
            return false;
        
        if (this.players[colour] != player)
            return false;

        let row = this.whereFall(column);
        if (row == null) //if the top slot was full
            return false; //move is invalid on this board

        this.state[row][column] = colour; //fill the chosen slot with the player's colour
        io.to(this.match.code).emit('move', this.id, this.match.turn, row, column); //tell the clients about this move

        
        let outcome = this.getOutcome(); //check if game has now ended
        if (outcome !== null) { //if it has
            this.outcome = outcome; //mark the game as done
            io.to(this.match.code).emit('outcomeDecided', this.id, outcome); //tell the clients about the outcome
        }


        return true;
    }

    checkLine(r, c, rD, cD) {
        let toCheck = this.state[r][c];
        if (toCheck === null) return false;
        let checking = [];
        for (let i = 1; i < this.match.lineLength; i++)
            checking.push(this.state[r + (i * rD)][c + (i * cD)]);
        return checking.every(t => t === toCheck);
    }

    getOutcome() {
        //Check down
        for (let r = 0; r <= this.match.rows - this.match.lineLength; r++)
            for (let c = 0; c < this.match.columns; c++)
                if (this.checkLine(r, c, 1, 0))
                    return this.state[r][c];
    
        //Check right
        for (let r = 0; r < this.match.rows; r++)
            for (let c = 0; c <= this.match.columns - this.match.lineLength; c++)
                if (this.checkLine(r, c, 0, 1))
                        return this.state[r][c];
    
        //Check down-right
        for (let r = 0; r <= this.match.rows - this.match.lineLength; r++)
            for (let c = 0; c <= this.match.columns - this.match.lineLength; c++)
            if (this.checkLine(r, c, 1, 1))
                    return this.state[r][c];
    
        //Check down-left
        for (let r = this.match.rows - (this.match.rows - this.match.lineLength + 1); r < this.match.rows; r++)
            for (let c = 0; c <= this.match.columns - this.match.lineLength; c++)
                if (this.checkLine(r, c, -1, 1))
                        return this.state[r][c];

        //Check if draw
        let isDraw = true;
        for (let row of this.state)
            if (row.includes(null)) {
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