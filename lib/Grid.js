

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
module.exports = {
    Grid: Grid,
}