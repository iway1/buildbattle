class Player {
    constructor(id, pos, hp) {
        console.log("Created new player with id " + id)
        this.id = id;
        this.pos = pos;
        this.hp = hp;
        this.direction = 0.0;
        this.moving = {
            up: false,
            down: false,
            left: false,
            right: false
        }
    }
    update(updateData) {
        if( updateData.id != undefined) this.id = updateData.id;
        if( updateData.pos != undefined ) {
            this.pos = updateData.pos;
        }
        if( updateData.hp != undefined) this.hp = updateData.hp;
        if( updateData.direction != undefined ) this.direction = updateData.direction;
    }
}

module.exports = {
    Player: Player,
}