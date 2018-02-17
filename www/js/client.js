
// This IP is hardcoded to my server, replace with your own


var pid = genRandomPid();


function genRandomPid() {

    return "" + Math.floor(Math.random() * 1000000);
}

socket.on('enterGame', function(dat){
    var game = new Game(socket, pid, {x: dat.x_spawn, y: dat.y_spawn}, dat.hp, dat.tile_width, dat.n_rows, dat.n_cols);
})


$(document).ready(function(){
    console.log("Connecting to game...");
    socket.emit('connectToGame', {id: pid});
})
$(window).on("beforeunload", function(){
    socket.emit("leaveGame", pid);
})


