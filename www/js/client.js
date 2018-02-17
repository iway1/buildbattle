
// This IP is hardcoded to my server, replace with your own


var pid = genRandomPid();


function genRandomPid() {

    return "" + Math.floor(Math.random() * 1000000);
}


var game = new Game(socket, pid);


$(window).on("beforeunload", function(){
    socket.emit("leaveGame", pid);
})


