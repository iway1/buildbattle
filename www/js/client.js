
// This IP is hardcoded to my server, replace with your own


var pid = genRandomPid();


function genRandomPid() {

    return "" + Math.floor(Math.random() * 1000000);
}


var game = new Game(socket, pid);
var initIo = function() {
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


$(window).on("beforeunload", function(){
    socket.emit("leaveGame", pid);
})


