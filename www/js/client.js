
// This IP is hardcoded to my server, replace with your own


var pid = genRandomPid();


function genRandomPid() {

    return "" + Math.floor(Math.random() * 1000000);
}


function resourcesLoaded() {
    console.log("Resources loaded...");
    var game = new Game(socket);

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
    connectToLobby(pid);
}

var image_urls = [
    'img/blue_player.png',
    'img/crosshair.png',
    'img/place_building.png'
]

PIXI.loader.add(image_urls).load(resourcesLoaded);

$(window).on("beforeunload", function(){
    socket.emit("leaveGame", pid);
})

$(document).ready( function(){


});

function connectToLobby(pid){
    console.log("Emitting connectToLobby...")
	socket.emit('connectToLobby', {id: pid});

}

