"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var http_1 = require("http");
var express = require("express");
var socket_io_1 = require("socket.io");
var uuid_1 = require("uuid");
var app = express();
var server = http_1.createServer(app);
var io = new socket_io_1.Server(server);
app.use(express.static(path.join(__dirname, 'public')));
var AVAILABLE_PLAYERS = [];
var ROOMS = [];
var findAPlayer = function () {
    return AVAILABLE_PLAYERS.length > 0 ? AVAILABLE_PLAYERS.shift() : false;
};
var createARoom = function (player1, player2) {
    // create a room
    var room = { id: uuid_1.v4(), players: [player1, player2] };
    ROOMS.push(room);
    console.log(room);
    return room;
};
io.on('connection', function (socket) {
    console.log('User has connected');
    socket.on('findMatch', function (_a) {
        var nickname = _a.nickname;
        console.log(nickname + " is looking for a match...");
        var playerOne = {
            name: nickname,
            skt: socket,
            hasPlayed: false,
        };
        var playerFounded = findAPlayer();
        if (!playerFounded) {
            AVAILABLE_PLAYERS.push(playerOne);
            return;
        }
        console.log('Match founded!! - Creating a room..');
        var room = createARoom(playerOne, playerFounded);
        var players = [];
        room.players.forEach(function (_a) {
            var skt = _a.skt, name = _a.name;
            skt.join(room.id);
            players.push(name);
        });
        // emit events just for a specific room
        io.to(room.id).emit('matchFounded', {
            roomId: room.id,
            players: players,
        });
    });
    var formatWinnerMessage = function (_a) {
        var player1 = _a.player1, player2 = _a.player2;
        if (player1 && player1) {
            return 'Os 2 venceram';
        }
        if (player1 && !player2) {
            return 'Player 1 venceu';
        }
        if (player2 && !player1) {
            return 'Player 2 venceu';
        }
        if (!player1 && !player2) {
            return 'Ninguem ganhou!';
        }
    };
    var matchIsOver = function (room) {
        return !room.players.map(function (player) { return player.hasPlayed; }).includes(false);
    };
    var getTheWinner = function (room) {
        var pl1 = room.players[0];
        var pl2 = room.players[1];
        var winners = { player1: false, player2: false };
        if (pl1.valueGuessed === pl2.valueInputed) {
            winners.player1 = true;
        }
        if (pl2.valueGuessed === pl1.valueInputed) {
            winners.player2 = true;
        }
        return formatWinnerMessage(winners);
    };
    socket.on('finishPlay', function (msg) {
        var room = ROOMS.find(function (e) { return msg.roomId === e.id; });
        room.players.forEach(function (player) {
            if (player.skt.id === socket.id) {
                player.hasPlayed = true;
                player.valueGuessed = msg.guessedValue;
                player.valueInputed = msg.inputedValue;
            }
        });
        if (matchIsOver(room)) {
            var msg_1 = getTheWinner(room);
            io.to(room.id).emit('matchIsOver', { msg: msg_1 });
            return;
        }
    });
});
var PORT = process.env.PORT || 3000;
server.listen(PORT, function () { return console.log("Server running on port " + PORT); });
