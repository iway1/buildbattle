class IsometricTileGenerator {
    constructor() {
        this.map = [
            [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,2,0,1,1,1,0,1,1],
            [1,1,1,0,1,0,0,0,0,0,0,0,0,1,1,0,2,0,1,1,1,0,1,0,],
            [1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,2,0,1,1,1,0,1,0],
            [1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,0,2,0,1,1,1,0,1,0],
            [1,0,0,1,1,0,1,0,1,1,1,0,1,1,1,0,2,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,1,1,0,1,1],
        ];
        this.tile_graphics = [];

    }
    loadImg() {
        let tile_graphics_to_load = ['img/grass-2.png', 'img/grass-3.png', 'img/grass-4.png'];
        let tile_loaded = 0;

        for (var i = 0; i < tile_graphics_to_load.length; i++) {
            this.tile_graphics[i] = new Image();
            this.tile_graphics[i].src = tile_graphics_to_load[i];
            this.tile_graphics[i].onload = function() {
            // Once the image is loaded increment the loaded graphics count and check if all images are ready.
                tile_loaded++;
                if (tile_loaded === tile_graphics_to_load.length) {
                    this.drawMap();
                }
            }.bind(this, tile_loaded);
        }
    }
    drawMap() {
        // create the canvas context
        var ctx = document.getElementById('game-canvas').getContext('2d');

        // Set as your tile pixel sizes, alter if you are using larger tiles.
        var tileH = 64;
        var tileW = 64;
                            
        // mapX and mapY are offsets to make sure we can position the map as we want.
        var mapX = 200;
        var mapY = -400;

        var drawTile;

            // loop through our map and draw out the image represented by the number.
        for (var i = 0; i < this.map.length; i++) {
            for (var j = 0; j < this.map[i].length; j++) {
                drawTile = this.map[i][j];
                // Draw the represented image number, at the desired X & Y coordinates followed by the graphic width and height.
                ctx.drawImage(this.tile_graphics[drawTile], (i - j) * tileH + mapX, (i + j) * tileH / 2 + mapY);
                      
            }
                
        }
    }
    init() {
        //document.removeEventListener('load', this.init);
        this.loadImg();
    }
    loaded() {
        document.addEventListener('load', this.init);
    }

}

class cTileGenerator {
    constructor() {
        this.map = [
            [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,2,],
            [1,1,1,0,1,0,0,0,0,0,0,0,0,1,1,0,2,],
            [1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,2,],
            [1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,0,2,],
            [1,0,0,1,1,0,1,0,1,1,1,0,1,1,1,0,2,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
            [1,0,1,0,0,0,0,1,1,1,0,1,0,1,1,0,0,],
        ];
        this.tile_graphics = [];

    }
    loadImg() {
        let tile_graphics_to_load = ['img/grass-2.png', 'img/grass-3.png', 'img/grass-4.png'];
        let tile_loaded = 0;

        for (var i = 0; i < tile_graphics_to_load.length; i++) {
            this.tile_graphics[i] = new Image();
            this.tile_graphics[i].src = tile_graphics_to_load[i];
            this.tile_graphics[i].onload = function() {
            // Once the image is loaded increment the loaded graphics count and check if all images are ready.
                tile_loaded++;
                if (tile_loaded === tile_graphics_to_load.length) {
                    this.drawMap();
                }
            }.bind(this, tile_loaded);
        }
    }
    drawMap() {
        // create the canvas context
        var ctx = document.getElementById('game-canvas').getContext('2d');

        // Set as your tile pixel sizes, alter if you are using larger tiles.
        var tileH = 64;
        var tileW = 64;
                            
        // mapX and mapY are offsets to make sure we can position the map as we want.
        var mapX = 0;
        var mapY = 0;

        var drawTile;

            // loop through our map and draw out the image represented by the number.
        for (var i = 0; i < this.map.length; i++) {
            for (var j = 0; j < this.map[i].length; j++) {
                drawTile = this.map[i][j];
                // Draw the represented image number, at the desired X & Y coordinates followed by the graphic width and height.
                ctx.drawImage(this.tile_graphics[drawTile], i * tileH, j * tileW);
                      
            }
                
        }
    }
    init() {
        //document.removeEventListener('load', this.init);
        this.loadImg();
    }
    loaded() {
        document.addEventListener('load', this.init);
    }

}
class TileGenerator {
    constructor() {
        this.map = [];

    }
    draw() {
        let ctx = document.getElementById('')
    }
}
//let tileGenerator = new IsometricTileGenerator();
//let tileGenerator = new cTileGenerator();
//tileGenerator.init();
//console.log("Yay");
