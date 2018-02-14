

var defaults = {
    'hp': 50,
    'player_move_speed': 5,
    'player_acceleration': .1,
    'player_size_radius': 16,
    'player_width': 32,
    'player_height': 32
}
document.image_urls = {
    blue_player: 'img/blue_player.png',
    crosshair: 'img/crosshair.png',
    place_building: 'img/place_building.png'
}

class Game {
    constructor(game_area_css_id, socket) {
        this.resource_nodes = [];
        this.opposing_players = [];
        this.opposing_player_map = {};
        this.canvas = $(game_area_css_id)[0];
        this.canvas_context = this.canvas.getContext('2d');
        this.socket = socket;
        this.sprite_draw = new SpriteDraw(this);
        this.selection_images = {
            place_building: resources.get("img/place_building.png")
        }
        console.log("Selection images: " + this.selection_images.place_building)
        console.log(resources.get("img/place_building.png"))
        var g = this;
        this.selected = 1;
        setInterval(function(){
            g.mainLoop();
        }, INTERVAL);
    }

    createCrosshair() {

        $("body").css("cursor", "none");
        this.crosshair = {x: 0, y: 0, img: resources.get(document.image_urls.crosshair)};

    }

    addLocalPlayer(player) {
        this.local_player = new Player(player.id, this.canvas, this, true, player.pos, player.hp);
        this.createCrosshair();
    }

    addOpposingPlayer(player) {
        this.opposing_players.push(new Player(player.id, this.canvas, this, false, player.pos, player.hp));
        this.opposing_player_map[player.id] = this.opposing_players.length - 1;
    }

    removeOpposingPlayer(pid) {
        console.log("Removed opposing player " + pid)
        this.opposing_players.splice(this.opposing_player_map[pid], 1);
        this.updateOpposingPlayerMap();
    }

    changeSelected(n) {
        this.selected = n

    }

    mainLoop(){
        if(this.local_player != undefined) {
            this.updateServer();
            this.tick();
            this.updateCanvas();
        }
    }

    tick() {
        this.local_player.move();
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

    updateCanvas() {
        this.canvas_context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.local_player.updateSprite();
        this.opposing_players.forEach(function(player){
            player.updateSprite();
        })
        if( this.selected == 2 ){
            console.log("This.selection_images: " + this.selection_images.place_building)
            this.sprite_draw.drawImage(this.selection_images.place_building, this.crosshair);
        }
        if( this.crosshair != undefined ) {
            this.sprite_draw.drawImage(this.crosshair.img, this.crosshair)
        }

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
        var players = server_data.players;
        players.forEach(function(server_player){
            if( this.local_player != undefined && server_player.id === this.local_player.id ) {
                // update any stuff that is handled server side.
            } else {

                if( this.opposing_players[this.opposing_player_map[server_player.id]] != undefined ){
                    this.opposing_players[this.opposing_player_map[server_player.id]].setFromUpdateData(server_player);
                }
            }
        }.bind(this))
    }
}



class Player {
    constructor(id, game_canvas, game, is_local, pos, hp) {
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
        this.sprite = new Sprite(this, document.image_urls.blue_player, pos, {width: 32, height: 32}, [], 0.0);
        if( is_local ) {
            this.setControls();
        }
    }

    getSpeed() {
        return Math.sqrt(this.x_speed*this.x_speed + this.y_speed*this.y_speed);
    }

    setDirection(mouse_x, mouse_y) {
        this.mouse = {x: mouse_x, y: mouse_y};
        this.direction = Math.atan2(mouse_x - (this.pos.x + this.width / 2), (this.pos.y + this.height / 2) - mouse_y);
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


//        if( this.moving.up || this.moving.down || this.moving.left || this.moving.right) {
//            if(this.speed < this.max_move_speed) {
//                var new_speed = this.speed + this.acceleration;
//                if (new_speed > this.max_move_speed ) {
//                    this.speed = this.max_move_speed;
//                } else {_m
//x_
//                    this.speed = new_speed;
//                }
//
//                let has_horizontal = this.moving.up ? !this.moving.down : this.moving.down // XOR moving up and down.
//                let has_vertical = this.moving.right ? !this.moving.left : this.moving.left // XOR moving left or right.
//                if(has_horizontal && has_vertical) {
//                    let x_component = // calculate x component
//                }
//            }
//        }
        if( this.moving.up ) this.pos.y -= this.max_move_speed;
        if( this.moving.down ) this.pos.y += this.max_move_speed;
        if( this.moving.right ) this.pos.x += this.max_move_speed;
        if( this.moving.left ) this.pos.x -= this.max_move_speed;
        if( this.mouse != undefined ) {
            this.setDirection(this.mouse.x, this.mouse.y);
        }
    }

    setFromUpdateData(player) {
        this.pos = player.pos;
        this.hp = player.hp;
        this.direction = player.direction;
    }

    updateSprite() {
        this.sprite.updatePosition(this.pos, this.direction);
    }
}

class SpriteDraw {
    constructor(game) {
        this.context = game.canvas_context;
    }
    drawRotatedImage(image, origin, size, angle) {
        this.context.translate(origin.x + size.width / 2, origin.y + size.height / 2);
        this.context.rotate(angle);
        this.context.drawImage(image, 0, 0, image.width, image.height, -size.width / 2, -size.height / 2, size.width, size.height);
        this.context.rotate(-angle);
        this.context.translate(-(origin.x + size.width / 2), -(origin.y + size.height / 2));
    }
    drawImage(image, origin, size) {
        this.context.drawImage(image, origin.x - image.width / 2, origin.y - image.height / 2);
    }
}

class Sprite {
    constructor(entity, url, pos, size, frames, direction, align_to_grid) {
        this.entity = entity;
        this.url = url;
        this.pos = pos;
        this.size = size;
        this.frames = frames;
        this._index = 0;
        this.frames = frames;
        this.direction = direction;
        this.image = resources.get(this.url);
        this.align_to_grid;
    }
    tick(delta_t) {
        this._index = (this._index + delta_t) % this.frames.length;
    }

    updatePosition(pos, direction) {
        this.pos = pos;
        this.direction = direction - Math.PI / 2;
        this.render(this.entity.game.canvas_context);
    }

    render(context) {
        this.entity.game.sprite_draw.drawRotatedImage(this.image, this.pos, this.size, this.direction);
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


