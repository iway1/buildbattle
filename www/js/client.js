var WIDTH = 1100;
var HEIGHT = 580;
// This IP is hardcoded to my server, replace with your own
var socket = io.connect('http://10.0.0.11:3000');
var game = new Game('#game-canvas', socket);
var pid = genRandomPid();


function genRandomPid() {

    return "" + Math.floor(Math.random() * 1000000);
}

/* Create image caches */
(function() {
    var resourceCache = {};
    var loading = [];
    var readyCallbacks = [];

    // Load an image url or an array of image urls
    function load(urlOrArr) {
        if(urlOrArr instanceof Array) {
            urlOrArr.forEach(function(url) {
                _load(url);
            });
        }
        else {
            _load(urlOrArr);
        }
    }

    function _load(url) {
        if(resourceCache[url]) {
            return resourceCache[url];
        }
        else {
            var img = new Image();
            img.onload = function() {
                console.log("Loaded " + url)
                resourceCache[url] = img;
                if(isReady()) {
                    readyCallbacks.forEach(function(func) { func(); });
                }
            };
            resourceCache[url] = false;
            img.src = url;
        }
    }

    function get(url) {
        return resourceCache[url];
    }

    function isReady() {
        var ready = true;
        for(var k in resourceCache) {
            if(resourceCache.hasOwnProperty(k) &&
               !resourceCache[k]) {
                ready = false;
            }
        }
        return ready;
    }

    function onReady(func) {
        readyCallbacks.push(func);
    }

    window.resources = {
        load: load,
        get: get,
        onReady: onReady,
        isReady: isReady
    };
})();


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
//
//socket.on('playerDied', function(pid){
//
//});

function resourcesLoaded() {
    console.log("Resources loaded...")
    connectToLobby(pid);
}

var image_urls = [
    'img/blue_player.png',
    'img/crosshair.png'
]

resources.load(image_urls);

resources.onReady(resourcesLoaded);

$(document).ready( function(){


});

function connectToLobby(pid){
    console.log("Emitting connectToLobby...")
	socket.emit('connectToLobby', {id: pid});

}

