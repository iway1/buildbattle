
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


class Grid {
    constructor(tile_width, n_vertical, n_horizontal) {
        this.rows = n_vertical;
        this.cols = n_horizontal;
        this.tile_width = tile_width;
        this.tile_buildable = this.makeOneArray(this.rows, this.cols);
        this.tile_walkable = this.makeOneArray(this.rows, this.cols);
    }
    makeOneArray(r, c) {
        var ret = [];
        var i = 0;
        var j = 0;
        while(i < r) {
            j = 0;
            var arr = [];
            ret.push(arr)
            while(j < c) {
                ret[i].push(1);
                j++;
            }
            i ++;
        }
        return ret;
    }
    isTileBuildable(row, col){
        return this.tile_buildable[row][col];
    }
    center(row, col){
        var x, y;
        x = this.tile_width / 2;
        y = this.tile_width / 2;

        return {x: x + (col * this.tile_width), y: y + (row * this.tile_width)};
    }
}

var StructureBuildTypes = {
    TILE: "TILE",
    EDGE: "EDGE",
    CORNER: "CORNER"
}

var Structures = {
    CRATE: "CRATE"
}

var StructureHP = {
    CRATE: 80
}

class Entity {
    constructor(game, entity_id, origin) {
        this.game = game;
        this.id = entity_id;
        this.origin = origin;
    }
}

class Structure extends Entity {
    constructor(game, owner_id, entity_id, hp, type, coords, walkable) {
        if( type == StructureBuildTypes.TILE ) {
            super(game, entity_id, game.grid.center(coords.row, coords.col));
        } else {
            // Default behavior... NEEDS TO BE CHANGED!!
            super(game, entity_id, game.grid.center(coords.row, coords.col))
        }
        this.owner_id = owner_id;
        this.destroy_procedures = {};
        this.type = type;
        this.id = entity_id;
        if( !this.walkable ) {
            if( this.type == StructureBuildTypes.TILE ) {
                this.game.grid.tile_walkable[coords.row][coords.col] = 0;
                this.game.grid.tile_buildable[coords.row][coords.col] = 0;
                // Revert changes when destroyed.
                this.destroy_procedures.setWalkable = this.setWalkable;
                this.destroy_procedures.setBuildable = this.setBuildable;
            }
        }
    }
    destroy() {
        procedures = Object.keys(this.destroy_procedures);
        var i = 0;
        while( i < procedures.length ) {
            this.destroy_procedures[procedures[i]]();
            i ++;
        }
    }

    setWalkable() {
        this.game.grid.tile_walkable[this.coords.row][this.coords.col] = 1;
    }

    setBuildable() {
        this.game.grid.tile_buildable[this.coords.row][this.coords.col] = 1;
    }


}

class Crate extends Structure {
    constructor(game, owner_id, entity_id, coords ) {
        super(game, owner_id, entity_id, StructureHP.CRATE, StructureBuildTypes.TILE, coords, false);
    }
}

var express = require('express');
var app = express();
var counter = 0;
var BALL_SPEED = 10;
var WIDTH = 1100;
var HEIGHT = 580;
var MAX_HP = 100;

var N_ROWS = 8;
var N_COLS = 12;
var TILE_WIDTH = 64;

//Static resources server
app.use(express.static(__dirname + '/www'));

var server = app.listen(process.env.PORT || 3000, function () {
	var port = server.address().port;
	console.log('Server running at port %s', port);
});

var io = require('socket.io')(server);

class GameServer{

    constructor(rows, cols, tile_width) {
        this.players = []
        this.structures = []
        this.player_map = {}
        this.structure_map = {}
        this.entities = [];
        this.entity_map = {}

        this.rows = rows;
        this.cols = cols;
        this.width = tile_width;
        this.grid = new Grid(TILE_WIDTH, N_ROWS, N_COLS);
    }

    newEntityId() {
        var id = "" + Math.floor(Math.random() * 1000000);
        while( id in this.entity_map ) {
            id = Math.floor(Math.random() * 1000000)
        }
        return id;
    }

    addPlayer(player) {
        console.log("Added player " + player.id)
        this.players.push(player);
        this.player_map[player.id] = this.players.length - 1;
    }
    playerDied(pid) {
        // Handle player death...
    }

    syncPlayer(player_data) {
        this.players.forEach(function(player){
            if( player_data.id === player.id) {
                player.update(player_data);
            }
        })
    }
    removePlayer(pid) {
        console.log("Removed player " + pid);
        this.players.splice(this.player_map[pid], 1);
        this.updatePlayerMap();
    }

    updatePlayerMap() {
        this.player_map = {};
        var c = 0;
        this.players.forEach(function(player) {
            this.player_map[player.id] = c;
            c++;
        }.bind(this));
    }
    updateStructureMap() {
        this.structure_map = {};
        var c = 0;
        this.structures.forEach(function(e) {
            this.structure_map[e.id] = c;
            c++;
        }.bind(this));
    }
    getData() {
        var structures = [];
        this.structures.forEach(function(structure) {
            structures.push({origin: structure.origin, type: structure.type, id: structure.id, owner: structure.owner_id})
        })
        return {players: this.players, grid: this.grid, structures: structures};
    }
    playerLeft(pid) {
        this.removePlayer(pid);
        console.log('Player with id ' + pid + ' has left the game! Removed from players.');
    }

    addCrate(owner_id, coords) {

        var crate = new Crate(this, owner_id, this.newEntityId(), coords);
        this.structure_map[crate.id] = this.structures.length;
        this.structures.push(crate);
        this.entity_map[crate.id] = this.entities.length;
        this.entities.push(crate);
    }
    destroyEntity(id) {
        this.entities.splice(this.entity_map[id], 1);
        this.updateEntityMap();
    }
}


var game = new GameServer(N_ROWS, N_COLS, TILE_WIDTH);

/* Connection events */

io.on('connection', function(client) {
	console.log('User connected');

	client.on('connectToGame', function(player){
	    var x_init = Math.floor(Math.random() * (N_COLS*TILE_WIDTH));
	    var y_init = Math.floor(Math.random() * (N_ROWS*TILE_WIDTH));
	    var new_player = new Player(player.id, {x: x_init, y: y_init}, 50);
        game.addPlayer(new_player);
        var dat = new_player;
        dat.n_rows = N_ROWS;
        dat.n_cols = N_COLS;
        dat.x_spawn = x_init;
        dat.y_spawn = y_init;
        dat.hp = MAX_HP;
        dat.tile_width = TILE_WIDTH;
        client.emit('enterGame', dat)
        client.broadcast.emit('addOpposingPlayer', new_player);
        console.log("Player connected. All player id:")
        game.players.forEach(function(player) {
            console.log(player.id);
        })
	})

	client.on('sync', function(data){
		//Receive data from client
		if(data.player != undefined){
			game.syncPlayer(data.player);
		}
		//Broadcast data to clients
		client.emit('sync', game.getData());
		client.broadcast.emit('sync', game.getData());
	});

	client.on('leaveGame', function(player_id) {
	    game.playerLeft(player_id);
	    console.log("Emitted player left signal.")
	    //client.broadcast.emit('playerLeft', player_id);
	})

	client.on('buildRequest', function(dat) {

	    if(dat.type == Structures.CRATE && game.grid.isTileBuildable(dat.coords.row, dat.coords.col)) {
            game.addCrate(dat.player_id, dat.coords);
	    }
	})


});


//
//function getRandomInt(min, max) {
//	return Math.floor(Math.random() * (max - min)) + min;
//}
