/*
MIT License
===========

Copyright (c) 2012 [Your name] <[Your email]>

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
*/

var	address = '127.0.0.1',
	port = 4000,
	initialSocket = null,
	GAME = {
		minPlayers: 2,
		started: false,
		players: {},
		created_at: false,
	};


var io = require('socket.io').listen(port);

io.sockets.on('connection', function (socket) {
	var socketId = socket.id;

	if (!initialSocket) {
		initialSocket = socket;
	}

	// EMIT connected
	socket.emit('connected', {
		id: socketId
	});


	// ON disconnect
	socket.on('disconnect', function (data) {
		delete GAME.players[socket.id];
	});

	// ON signup
	socket.on('signup', function (data) {
		if (data) {
			if (data.id && data.userName && data.avatar) {
				var socketId = data.id,
					user = {
						id: socketId,
						userName: data.userName,
						avatar: data.avatar
					};

				GAME.players[socketId] = user;

				socket.emit('signup', {
					success: true,
					result: user
				});

				socket.broadcast.emit('new_player', {userName: user.userName});
			}
			else {
				socket.emit('signup', {
					success: false,
					message: 'Os dados estão inválidos. Recarregue a página e tente novamente',
					result: false
				});
			}
		}
	});


	// ON updateGrid
	socket.on('updateGrid', function (data) {

		socket.emit('updateGrid', {
			success: true,
			result: {
				players: GAME.players
			}
		});
	});

	socket.on('move', function (data) {
		if (GAME.started == true) {
			var playerId = data.id;

			if (GAME.players[playerId] && GAME.players[playerId]) {
				GAME.players[data.id].position =+ 10;
			}
		}
	});
});

function checkForStart() {
	console.log('Checando jogadores necessários...');
	TIME_checkForStart = setInterval(function () {
		if (GAME.started == false) {
			var total = totalPlayers();

			if (total >= GAME.minPlayers) {

				initialSocket.broadcast.emit('prepareRace', {
					success: true
				});

				startGame();

				clearInterval(TIME_checkForStart);
			}
			else {
				console.log('Aguardando mínimo de jogadores necessários: ' + GAME.minPlayers);
			}
		} else {
			clearInterval(TIME_checkForStart);
		}
	}, 2000);
}

function startGame() {
	var date = new Date().getTime();

	GAME.freezetime = 6;
	GAME.started    = false;

	TIME_freezeTime = setInterval(function () {
		GAME.freezetime--;

		if (GAME.freezetime > 0) {
			initialSocket.broadcast.emit('freezetime', {
				timeLeft: GAME.freezetime,
				success: true
			});
		}
		else {

			GAME.started = true;
			GAME.created_at = date;

			initialSocket.broadcast.emit('start', {
				game: GAME,
				success: true
			});

			clearInterval(TIME_freezeTime);
		}
	}, 1000);

}

function totalPlayers() {
	var players = 0;

	for (player in GAME.players) {
		players++;
	}

	return parseInt(players);
}

checkForStart();

console.log('Server started on port ' + port + '. URL: http://' + address + ':' + port + '/');