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
    }

    addPlayer(player) {
        this.players.push(player);
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
    getData() {
        return {players: this.players};
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
	    game.players.forEach(function(player){
	        client.emit('addOpposingPlayer', player);
	    }.bind(this))
        game.addPlayer(new_player);
        client.emit('addLocalPlayer', new_player);
        client.broadcast.emit('addOpposingPlayer', new_player)
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
        console.log("Updating player ID " + updateData.id);
        if( updateData.id != undefined) this.id = updateData.id;
        if( updateData.pos != undefined ) {
            this.pos = updateData.pos;
            console.log("New x: " + this.pos.x + " New y: " + this.pos.y);
        }
        if( updateData.hp != undefined) this.hp = updateData.hp;
        if( updateData.direction != undefined ) this.direction = updateData.direction;
    }
}
//
//function getRandomInt(min, max) {
//	return Math.floor(Math.random() * (max - min)) + min;
//}
