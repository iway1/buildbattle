var express = require('express');
var app = express();
//Static resources server
app.use(express.static(__dirname + '/www'));
var server = app.listen(process.env.PORT || 3000, function () {
    var port = server.address().port;
    console.log('Server running at port %s', port);
});
var io = require('socket.io')(server);



let Player = require('./lib/Player.js').Player;
let Grid = require('./lib/Grid.js').Grid;
let Entity = require('./lib/Entity.js').Entity;
let Crate = require('./lib/Entity.js').Crate;





var Structures = {
    CRATE: "CRATE"
}

let N_ROWS = 10;
let N_COLS = 12;
let TILE_WIDTH = 64;

let MAX_HP = 15;


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
