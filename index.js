Array.prototype.remove = function(from, to){
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
var express = require('express');
var app = express();
var counter = 0;
var BALL_SPEED = 10;
var WIDTH = 1100;
var HEIGHT = 580;
var TANK_INIT_HP = 100;

//Static resources server
app.use(express.static(__dirname + '/www'));

var server = app.listen(process.env.PORT || 3000, function () {
	var port = server.address().port;
	console.log('Server running at port %s', port);
});

var io = require('socket.io')(server);

class GameServer{

    constructor() {
        this.players = []
        this.player_map = {}
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
    getData() {
        return {players: this.players};
    }
    playerLeft(pid) {
        this.removePlayer(pid);
        console.log('Player with id ' + pid + ' has left the game! Removed from players.');
    }
}


var game = new GameServer();

/* Connection events */

io.on('connection', function(client) {
	console.log('User connected');

	client.on('connectToLobby', function(player){
	    var x_init = 500;
	    var y_init = 500;
	    var new_player = new Player(player.id, {x: x_init, y: y_init}, 50);
        game.addPlayer(new_player);
        client.emit('addLocalPlayer', new_player);
        client.broadcast.emit('addOpposingPlayer', new_player);
        console.log("Added player. Players are now: ")
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


});

class Player {
    constructor(id, pos, hp) {
        console.log("Created new player with id " + id)
        this.id = id;
        this.pos = pos;
        this.hp = hp;
        this.direction = 0.0;
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

    }

}
//
//function getRandomInt(min, max) {
//	return Math.floor(Math.random() * (max - min)) + min;
//}
