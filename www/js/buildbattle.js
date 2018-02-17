

var defaults = {
    'hp': 50,
    'player_move_speed': 5,
    'player_acceleration': .1,
    'player_size_radius': 16,
    'player_width': 32,
    'player_height': 32
}

var colors = {
    'bright-red': 0xff2511,
    'light-green': 0x72ff8e
}

var StructureBuildTypes = {
    TILE: "TILE",
    EDGE: "EDGE",
    CORNER: "CORNER"
}


class Game {
    constructor(socket, player_id, spawn_point, start_hp, tile_width=64, n_rows=10, n_cols=12) {
        console.log("Initializing game...")
        this.player_id = player_id;
        this.resource_nodes = [];
        this.opposing_players = [];
        this.opposing_player_map = {};
        this.entities = [];
        this.entity_map = {};
        this.rows = n_rows;
        this.cols = n_cols;
        this.tile_width = tile_width;
        this.socket = socket;
        this.init_info = {spawn_point: spawn_point, hp: start_hp};
        this.selected_slot = 1;
        this.selected_buildable = 0;
        this.buildables = {

        }
        window.phaser_game = new Phaser.Game(tile_width*n_cols, tile_width*n_rows, Phaser.AUTO, 'build-battle', { preload: this.preload, create: this.create.bind(this) , update: this.mainLoop.bind(this)});

        console.log("Finished initializing game...")
    }
    preload() {
        phaser_game.load.image('blue_player', 'img/blue_player.png');
        phaser_game.load.image('crosshair', 'img/crosshair.png');
        phaser_game.load.image('place_building', 'img/place_building.png');
        phaser_game.load.image('crate', 'img/crate.png');
        console.log("Loaded images.")
    }

    createCrosshair() {
        $("body").css("cursor", "none");
        console.log("Created crosshair.")
        this.crosshair = phaser_game.add.sprite(50, 50, 'crosshair');
        this.crosshair.anchor.setTo(.5);
    }

    create() {
        phaser_game.stage.backgroundColor = "E9F283";
        console.log("Running create");
        this.initIo();
        this.createGrid();
        this.addLocalPlayer({id: this.player_id});
        this.createBuildables();
	    this.socket.emit('connectToLobby', {id: this.player_id});
    }

    createGrid() {
        this.grid = new Grid(this.tile_width, this.rows, this.cols);
        this.grid.hideAll();
    }

    setCrosshair(x, y) {
        this.crosshair.x = x;
        this.crosshair.y = y;
        if( this.selected_buildable ) {
            var b = this.buildables[this.selected_slot];
            var sprite = b.sprite;
            if( b.type = StructureBuildTypes.TILE ) {



            } else {
                this.buildables[this.selected_slot].sprite.x = x;
                this.buildables[this.selected_slot].sprite.y = y;
            }
        }
    }

    createBuildables() {
        var crate_sprite = phaser_game.add.sprite(0, 0, "crate")
        crate_sprite.anchor.set(.5);
        crate_sprite.visible = 0;
        crate_sprite.alpha = .3;
        this.buildables[2] = {sprite: crate_sprite, type: StructureBuildTypes.TILE, walkable: false};

    }

    updateSelectedSlot() {
        var buildables = Object.keys(this.buildables);
        buildables.forEach(function(b) {
            this.buildables[b].sprite.visible = 0;
        }.bind(this));
        if( this.selected_slot in this.buildables ) {
            var sprite = this.buildables[this.selected_slot].sprite;
            this.crosshair.visible = 0;
            sprite.visible = 1;

            sprite.x = this.crosshair.x;
            sprite.y = this.crosshair.y;
            this.selected_buildable = 1;
        } else {
            this.crosshair.visible = 1;
            this.selected_buildable = 0;
        }
    }

    addLocalPlayer() {
        console.log("Attempting to add local player...")
        console.log("Game: ")
        console.log(this);
        this.local_player = new Player(this.player_id, this, true, this.init_info.spawn_point, this.init_info.hp);
        this.createCrosshair();
    }

    addOpposingPlayer(player) {

        this.opposing_players.push(new Player(player.id, this, false, player.pos, player.hp));
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

    updateEntityMap() {
        this.entity_map = {};
        var c = 0;
        this.entities.forEach(function(entity) {
            this.opposing_player_map[entity.id] = c;
            c ++;
        }.bind(this))
    }

    playerLeft(pid) {
        console.log("Player left " + pid)
        this.removeOpposingPlayer(pid)
    }

    syncWithServer(server_data) {
        // Update from server here...
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

    initIo() {
        var game = this;
        var socket = this.socket;
        socket.on('addLocalPlayer', function(player){
            game.addLocalPlayer(player);
        });
        //
        socket.on('addOpposingPlayer', function(player){
            game.addOpposingPlayer(player);
        });
        //
        socket.on('sync', function(gameServerData){
            game.syncWithServer(gameServerData);
        });

        socket.on('playerLeft', function(player_id) {
            console.log("Received player left signal.")
            game.playerLeft(player_id);
        });
    }
}



class Player {
    constructor(id, game, is_local, pos, hp) {
        console.log("Player created...");
        this.id = id;
        this.game = game;
        this.max_move_speed = defaults.player_move_speed;
        this.acceleration = defaults.player_acceleration;
        this.width = defaults.player_width;
        this.height = defaults.player_height;
        this.direction = 0;
        this.move_direction = 0;
        this.speed = 0;
        this.pos = pos;
        this.selected_slot = 1;

        this.moving = {
            up: false,
            down: false,
            left: false,
            right: false
        }
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
            var k = e.key.toLowerCase();
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
                case 'g':
                    t.game.grid.toggleShow();
                    break;
            }
            if(!isNaN(k)) {
                t.game.selected_slot = Number.parseInt(k);
                t.game.updateSelectedSlot();
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
            }
        }).mousemove(function(e) {
            t.setDirection(e.pageX, e.pageY);
            if( t.game.crosshair != undefined ){
                t.game.setCrosshair(e.pageX, e.pageY);
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

class Grid {
    constructor(width, n_rows, n_cols) {
        console.log("Grid constructed.")
        this.rows = n_rows;
        this.cols = n_cols;
        this.tile_width = width;
        this.tile_buildable = this.makeOneArray(this.rows, this.cols);
        this.buildable_graphics = this.buildableGraphics();
        this.grid_graphics = this.gridGraphics();

    }

    toggleShow() {
        if( this.grid_graphics.visible == 0 ) {
            this.showAll();
        } else {
            this.hideAll();
        }
    }

    showGrid() {
        this.grid_graphics.visible = true;
    }

    hideGrid() {
        this.grid_graphics.visible = false;
    }

    showBuildable(){
        this.buildable_graphics.visible = true;
    }

    hideBuildable() {
        this.buildable_graphics.visible = false;
    }

    showAll() {
        this.showGrid();
        this.showBuildable();

    }

    hideAll() {
        this.hideGrid();
        this.hideBuildable();
    }

    buildableGraphics() {
        console.log("Drawing buildable graphics...")
        var graphics = phaser_game.add.graphics(0, 0);
        var i = 0;
        var j = 0;
        while(i < this.rows) {
            j = 0;
            while( j < this.cols ) {
                if(this.tile_buildable[i][j]) {
                    graphics.beginFill(colors['light-green'], .1);
                } else {
                    graphics.beginFill(colors['bright-red'], .1);
                }

                graphics.drawRect(j*this.tile_width, i*this.tile_width, this.tile_width, this.tile_width);
                graphics.endFill();
                j++;
            }
            i++;
        }
        return graphics;
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
    topLeft(x, y) {
        return {x: this.col(x) * this.tile_width, y: this.row(y) * this.tile_width};
    }
    center(x, y) {
        return {x: this.col(x) * this.tile_width + this.tile_width / 2, y: this.row(y) * this.tile_width + this.tile_width / 2}
    }

    row(y) {
        return Math.floor(y / this.tile_width);
    }

    col(x) {
        return Math.floor(x / this.tilewidth);
    }
    coords(x, y) {
        return {row: this.row(y), col: this.col(x)};
    }

    gridGraphics() {
        console.log("Drawing grid graphics.")
        var graphics = phaser_game.add.graphics(0, 0);
        graphics.lineStyle(2, 0x333333, .3);
        var i = 0;
        while(i < this.rows) {
            graphics.moveTo(0, i*this.tile_width);
            graphics.lineTo(this.cols*this.tile_width, i*this.tile_width);
            i++;
        }

        i = 0;
        while( i < this.cols) {
            graphics.moveTo(i*this.tile_width, 0);
            graphics.lineTo(i*this.tile_width, this.rows*this.tile_width - 1);
            i++;
        }
        return graphics;
    }



}


