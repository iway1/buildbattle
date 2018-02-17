

var defaults = {
    'hp': 50,
    'player_move_speed': 5,
    'player_acceleration': .1,
    'player_size_radius': 16,
    'player_width': 32,
    'player_height': 32
}



class Game {
    constructor(socket, player_id, width=800, height=600) {
        console.log("Initializing game...")
        this.player_id = player_id;
        this.resource_nodes = [];
        this.opposing_players = [];
        this.opposing_player_map = {};
        this.socket = socket;
        var g = this;
        window.phaser_game = new Phaser.Game(width, height, Phaser.CANVAS, 'build-battle', { preload: this.preload, create: this.create.bind(this) , update: this.mainLoop.bind(this)});

        console.log("Finished initializing game...")
    }
    preload() {
        phaser_game.load.image('blue_player', 'img/blue_player.png');
        phaser_game.load.image('crosshair', 'img/crosshair.png');
        phaser_game.load.image('place_building', 'img/place_building.png');
        console.log("Loaded images.")
    }

    createCrosshair() {
        $("body").css("cursor", "none");
        this.crosshair = phaser_game.add.sprite(50, 50, 'crosshair');
        this.crosshair.anchor.setTo(.5);
    }

    create() {
        phaser_game.stage.backgroundColor = "#182d3b";
        console.log("Running create");
        initIo();
	    this.socket.emit('connectToLobby', {id: this.player_id});
    }
    addLocalPlayer(player) {
        console.log("Attempting to add local player...")
        this.local_player = new Player(player.id, this.canvas, this, true, player.pos, player.hp);
        this.createCrosshair();
    }

    addOpposingPlayer(player) {
        this.opposing_players.push(new Player(player.id, this.canvas, this, false, player.pos, player.hp));
        this.opposing_player_map[player.id] = this.opposing_players.length - 1;
        this.opposing_players[this.opposing_players.length - 1].updateSprite();
    }

    removeOpposingPlayer(pid) {
        console.log("Removed opposing player " + pid)
        var index = this.opposing_player_map[pid];
        this.opposing_players[index].sprite.kill();
        this.opposing_players.splice(index, 1);
        this.updateOpposingPlayerMap();
    }

    changeSelected(n) {
        this.selected = n;

    }

    mainLoop(dt){
        if(this.local_player != undefined ) {
            this.updateServer();
            this.tick(); // Handle entity updates.
        }
    }

    tick() {
        this.local_player.move();
        this.opposing_players.forEach(function(player){
            player.updateSprite();
        }.bind(this))
    }

    updateServer() {
        var game_data = {};
        game_data.player = {
            id: this.local_player.id,
            pos: {x: this.local_player.pos.x, y: this.local_player.pos.y},
            direction: this.local_player.direction
        };
        this.socket.emit('sync', game_data);
    }

    updateOpposingPlayerMap() {
        this.opposing_player_map = {};
        var c = 0;
        this.opposing_players.forEach(function(player){
            this.opposing_player_map[player.id] = c;
            c++;
        }.bind(this))
    }

    playerLeft(pid) {
        console.log("Player left " + pid)
        this.removeOpposingPlayer(pid)
    }

    syncWithServer(server_data) {
        // Update from server here...
        console.log("Receiving server update.")
        var players = server_data.players;
        var c = 0;
        var unencountered_opposing_players = Object.keys(this.opposing_player_map);

        players.forEach(function(server_player){
            if( this.local_player != undefined && server_player.id === this.local_player.id ) {
                // update any stuff that is handled server side.
            } else {

                if( this.opposing_players[this.opposing_player_map[server_player.id]] != undefined ){
                    this.opposing_players[this.opposing_player_map[server_player.id]].setFromUpdateData(server_player);
                    unencountered_opposing_players.splice(unencountered_opposing_players.indexOf(server_player.id), 1)
                } else {
                    this.addOpposingPlayer(server_player);

                }
            }
        }.bind(this))
        unencountered_opposing_players.forEach(function(player) {
            this.removeOpposingPlayer(player);
        }.bind(this))
    }
}



class Player {
    constructor(id, game_canvas, game, is_local, pos, hp) {
        console.log("Player created...");
        this.id = id;
        this.max_move_speed = defaults.player_move_speed;
        this.acceleration = defaults.player_acceleration;
        this.game_canvas = game_canvas;
        this.width = defaults.player_width;
        this.height = defaults.player_height;
        this.direction = 0;
        this.move_direction = 0;
        this.speed = 0;
        this.pos = pos;

        this.moving = {
            up: false,
            down: false,
            left: false,
            right: false
        }
        this.game = game;
        this.is_local = is_local;
        this.hp = hp;
	    this.sprite = phaser_game.add.sprite(pos.x, pos.y, 'blue_player');
	    this.sprite.anchor.setTo(.5);
	    this.sprite.width = this.width;
	    this.sprite.height = this.height
        if( is_local ) {
            this.setControls();
        }
    }

    getSpeed() {
        return Math.sqrt(this.x_speed*this.x_speed + this.y_speed*this.y_speed);
    }

    setDirection(mouse_x, mouse_y) {
        this.mouse = {x: mouse_x, y: mouse_y};
        this.direction = Math.atan2(mouse_x - (this.pos.x), (this.pos.y) - mouse_y) - Math.PI / 2;
        this.sprite.rotation = this.direction;
    }

    setControls() {
        var t = this;
        $(document).keypress(function(e){
            var k = e.key;
            switch(k) {
                case 'w':
                    t.moving.up = true;
                    break;
                case 'd':
                    t.moving.right = true;
                    break;
                case 's':
                    t.moving.down = true;
                    break;
                case 'a':
                    t.moving.left = true;
                    break;
                case '1':
                    t.game.changeSelected(1);
                    break;
                case '2':
                    t.game.changeSelected(2);
                    break;
            }

        }).keyup(function(e){
            var k = e.key;
            switch(k) {
                case 'w':
                    t.moving.up = false;
                    break;
                case 'd':
                    t.moving.right = false;
                    break;
                case 's':
                    t.moving.down = false;
                    break;
                case 'a':
                    t.moving.left = false;
                    break;
                case '1':


            }
        }).mousemove(function(e) {
            t.setDirection(e.pageX, e.pageY);
            if( t.game.crosshair != undefined ){
                t.game.crosshair.x = e.pageX;
                t.game.crosshair.y = e.pageY;
            }
        })
    }



    move() {
        var deltatime = 1.;
        if( this.moving.up ) this.pos.y -= this.max_move_speed * deltatime;
        if( this.moving.down ) this.pos.y += this.max_move_speed * deltatime;
        if( this.moving.right ) this.pos.x += this.max_move_speed * deltatime;
        if( this.moving.left ) this.pos.x -= this.max_move_speed * deltatime;
        if( this.mouse != undefined ) {
            this.setDirection(this.mouse.x, this.mouse.y);
        }
        this.sprite.x = this.pos.x;
        this.sprite.y = this.pos.y;
    }

    updateSprite() {
        this.sprite.x = this.pos.x;
        this.sprite.y = this.pos.y;
        this.sprite.rotation = this.direction;
    }

    setFromUpdateData(player) {
        this.pos = player.pos;
        this.hp = player.hp;
        this.direction = player.direction;
    }
}

class GameGrid {
    constructor(game, x_tiles, y_tiles, tile_width, tile_height) {
        this.game = game;
        this.x_tiles = x_tiles;
        this.y_tiles = y_tiles;
        this.tile_width = defaults.tile_width;
        this.tile_height = tile_height;
    }

    renderImageAligned(image, coords) {
        context.drawImage(image, coords.x, coords.y, this.tile_width, this.tile_height);
    }

}


