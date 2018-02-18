var StructureHP = {
    CRATE: 80
}

var StructureBuildTypes = {
    TILE: "TILE",
    EDGE: "EDGE",
    CORNER: "CORNER"
}

var Structures = {
    CRATE: "CRATE"
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
        this.destroy_procedures = {};
        this.build_type = type;
        this.type = type;
        this.id = entity_id;
        if( !this.walkable ) {
            if( this.build_type == StructureBuildTypes.TILE ) {
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
        super(game, owner_id, entity_id, StructureHP.CRATE, Structures.CRATE, StructureBuildTypes.TILE, coords, false);
    }
}

module.exports = {
	Entity: Entity,
	Crate: Crate
}