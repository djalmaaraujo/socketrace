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

var GameServer = function() {
	var	instance  = this;

	instance.settings = {
		SERVER_PORT: 4000
	};

	instance.initialSocket = null,

	instance.GAME = {
		minPlayers: 2,
		started: false,
		players: {},
		created_at: false
	};

	instance.IO = require('socket.io').listen(instance.settings.SERVER_PORT);

	instance.bootstrap();
};

GameServer.prototype.bootstrap = function () {
	var instance = this;

	instance.handlers();
	instance.checkForStart();

	console.log('Server started on port ' + instance.settings.SERVER_PORT + '. URL: http://' + instance.settings.SERVER_ADDRESS + ':' + instance.settings.SERVER_PORT + '/');
};

GameServer.prototype.handlers = function () {
	var instance = this;

	instance.IO.sockets.on('connection', function (socket) {
		var socketId = socket.id;

		if (!instance.initialSocket) {
			instance.initialSocket = socket;
		}

		if (instance.GAME.started) {
			socket.emit('waitForNextGame', {success: true});
			return false;
		}

		// EMIT connected
		socket.emit('connected', {
			id: socketId
		});

		// ON disconnect
		socket.on('disconnect', function (data) {
			delete instance.GAME.players[socket.id];
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

					instance.GAME.players[socketId] = user;

					socket.emit('signup', {
						success: true,
						result: user
					});

					socket.broadcast.emit('newPlayer', {userName: user.userName});
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
					players: instance.GAME.players,
					total: instance.totalPlayers()
				}
			});
		});

		socket.on('move', function (data) {
			if (instance.GAME.started == true) {
				var playerId = data.id;

				if (instance.GAME.players[playerId] && instance.GAME.players[playerId]) {
					instance.GAME.players[data.id].position =+ 10;
				}
			}
		});
	});
};

GameServer.prototype.checkForStart = function () {
	var instance = this;

	console.log('Checando jogadores necessários...');

	instance.TIME_checkForStart = setInterval(function () {
		if (instance.GAME.started == false) {
			var total = instance.totalPlayers();

			if (total >= instance.GAME.minPlayers) {

				instance.initialSocket.broadcast.emit('prepareRace', {
					success: true
				});

				instance.startGame();

				clearInterval(instance.TIME_checkForStart);
			}
			else {
				console.log('Aguardando mínimo de jogadores necessários: ' + instance.GAME.minPlayers);
			}
		} else {
			clearInterval(instance.TIME_checkForStart);
		}
	}, 2000);
};

GameServer.prototype.startGame = function () {
	var instance                 = this,
		date                     = new Date();

	instance.GAME.freezetime = 6,
	instance.GAME.started    = false;
	instance.TIME_freezeTime = setInterval(function () {
		instance.GAME.freezetime--;

		if (instance.GAME.freezetime > 0) {
			instance.initialSocket.broadcast.emit('freezetime', {
				timeLeft: instance.GAME.freezetime,
				success: true
			});
		}
		else {
			instance.GAME.started = true;
			instance.GAME.created_at = date.getTime();

			instance.initialSocket.broadcast.emit('start', {
				game: instance.GAME,
				success: true
			});

			clearInterval(instance.TIME_freezeTime);
		}
	}, 1000);

};

GameServer.prototype.finishGame = function () {
	var instance = this;

	instance.GAME.started = false;
	instance.initialSocket.broadcast.emit('showScore', {game: instance.GAME});
};

GameServer.prototype.totalPlayers = function () {
	var instance = this,
		players = 0;

	for (player in instance.GAME.players) {
		players++;
	}

	return parseInt(players);
};

new GameServer();