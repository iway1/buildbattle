

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

var StructureTypes = {
    CRATE: "CRATE"
}


var InventoryItemTypes = {
    BUILDABLE: "BUILDABLE",
    NONE: "NONE"
}

class Game {
    constructor(socket, player_id, spawn_point, start_hp, tile_width=64, n_rows=10, n_cols=12) {
        console.log("Initializing game...")
        this.player_id = player_id;
        this.resource_nodes = [];
        this.opposing_players = [];
        this.opposing_player_map = {};
        this.structures = []
        this.structure_map = {};
        this.rows = n_rows;
        this.cols = n_cols;
        this.tile_width = tile_width;
        this.socket = socket;
        this.init_info = {spawn_point: spawn_point, hp: start_hp};
        this.selected_item = 1;
        this.inventory_items = [];


        window.phaser_game = new Phaser.Game(tile_width*n_cols, tile_width*n_rows, Phaser.CANVAS, 'build-battle', { preload: this.preload, create: this.create.bind(this) , update: this.mainLoop.bind(this)});

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
        this.initInventory();
        phaser_game.input.onDown.add(this.clickDown, this);
	    this.socket.emit('connectToLobby', {id: this.player_id});
    }

    createGrid() {
        this.grid = new Grid(this.tile_width, this.rows, this.cols);
        this.grid.hideAll();
    }

    setCrosshair(x, y) {
        this.crosshair.x = x;
        this.crosshair.y = y;
        var i = this.inventory_items[this.selected_item - 1];
        if( i.type == InventoryItemTypes.BUILDABLE ) {
            i.updateBuildSprite();
        }
    }

    getSelectedItem() {
        return this.inventory_items[this.selected_item - 1]
    }

    clickDown(pointer) {
        // Code for click down..
        var x, y;
        x = pointer.x;
        y = pointer.y;
        console.log("Did click down.")
        var i = this.getSelectedItem();
        if( i.type == InventoryItemTypes.BUILDABLE ) {
            this.sendBuildRequest(i.structure_type, this.grid.coords(x, y));
        } else {
            //Default
        }
    }

    sendBuildRequest(structure_type, coords) {
        console.log("Sending build request...")
        this.socket.emit('buildRequest', {player_id: this.player_id, type: structure_type, coords: coords});
    }

    initInventory() {
        var crate_sprite = phaser_game.add.sprite(0, 0, "crate")
        crate_sprite.anchor.set(.5);
        crate_sprite.visible = 0;
        crate_sprite.alpha = .3;
        this.inventory_items.push({type: InventoryItemTypes.NONE})
        this.inventory_items.push(new CrateInventoryItem(this));
    }

    updateSelectedSlot() {
        if(this.selected_item > this.inventory_items.length) return;
        this.inventory_items.forEach(function(item){
            if( item.type == InventoryItemTypes.BUILDABLE) {
                item.sprite.visible = 0;
            }
        }.bind(this))
        var i = this.inventory_items[this.selected_item - 1]
        if(i.type == InventoryItemTypes.BUILDABLE) {
            i.sprite.visible = 1;
            i.updateBuildSprite();
        }
    }

    addLocalPlayer() {
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
        var structures = server_data.structures;
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

        var updateStructures = function(){
            structures.forEach(function(structure){
                if(!(structure.id in this.structure_map)) {
                    if( structure.type == StructureTypes.CRATE ) {
                        this.structures.push(new Crate(this, structure.owner_id, structure.id, structure.origin))
                    }
                }
            }.bind(this))
        }.bind(this)
        console.time("updateStructures");
        updateStructures();
        console.timeEnd("updateStructures")

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
	    this.sprite.height = this.height;
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
                var i = Number.parseInt(k);
                if(k != 0 && k <= t.game.inventory_items.length){
                    t.game.selected_item = Number.parseInt(k);
                    console.log("New selected slot " + k)
                    t.game.updateSelectedSlot();
                }
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
        }).mousedown(function(e){
            console.log("Mouse down detected.")
            t.game.clickDown(e.pageX, e.pageY);
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
        this.tile_walkable = this.makeOneArray(this.rows, this.cols);
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

    centerFromCoords(row, col) {
        var x, y;
        x = this.tile_width / 2;
        y = this.tile_width / 2;

        return {x: x + (col * this.tile_width), y: y + (row * this.tile_width)};
    }

    row(y) {
        return Math.floor(y / this.tile_width);
    }

    col(x) {
        return Math.floor(x / this.tile_width);
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



class Entity {
    constructor(game, entity_id, origin) {
        this.game = game;
        this.id = entity_id;
        this.origin = origin;
    }
}

class Structure extends Entity {
    constructor(game, owner_id, entity_id, hp, type, build_type, coords, walkable) {
        if( type == StructureBuildTypes.TILE ) {
            super(game, entity_id, game.grid.center(coords.row, coords.col));
        } else {
            // Default behavior... NEEDS TO BE CHANGED!!
            super(game, entity_id, game.grid.center(coords.row, coords.col))
        }
        this.owner_id = owner_id;
        this.type = type;
        this.id = entity_id;
    }
}

class Crate extends Structure {
    constructor(game, owner_id, entity_id, origin, hp ) {
        super(game, owner_id, entity_id, hp, StructureTypes.CRATE, StructureBuildTypes.TILE, origin, false);
        this.sprite = phaser_game.add.sprite(origin.x, origin.y, "crate");
        this.sprite.anchor.set(.5);
    }
}

class InventoryItem {
    constructor(game, sprite, type) {
        this.game = game;
        this.sprite = sprite;
        this.type = type;
    }
}

class Buildable extends InventoryItem {
    constructor(game, sprite, build_type) {
        sprite.visible = 0;
        sprite.anchor.set(.5);
        super(game, sprite, InventoryItemTypes.BUILDABLE);
        this.build_type = build_type;
    }
    updateBuildSprite() {
        if( this.build_type == StructureBuildTypes.TILE ) {
            var center = this.game.grid.center(this.game.crosshair.x, this.game.crosshair.y);
            this.sprite.x = center.x;
            this.sprite.y = center.y;
        } else {
            //Default behavior
            this.sprite.x = this.game.crosshair.x;
            this.sprite.y = this.game.crosshair.y;
        }
    }
}

class CrateInventoryItem extends Buildable {
    constructor(game) {
        var sprite = phaser_game.add.sprite(0, 0, "crate");
        sprite.alpha = .3;
        super(game, sprite, StructureBuildTypes.TILE);
        this.structure_type = StructureTypes.CRATE;
    }
}
