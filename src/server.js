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

var SOCKETRACE_CONFIG = require('../config.js').SOCKETRACE_CONFIG,
	CONST             = require('./constants.js').SOCKETRACE_CONSTANTS,
	ce                = require('cloneextend');

var GameServer = function() {
	var	instance  = this;

	instance.SETTINGS      = ce.clone(SOCKETRACE_CONFIG);
	instance.broadCastSocket = null;
	instance.GAME          = ce.clone(instance.SETTINGS.game);
	instance.IO            = require(CONST.SOCKET_IO).listen(instance.SETTINGS.serverPort);
	instance.DASHBOARD     = instance.IO;

	instance.bootstrap();
};

GameServer.prototype.bootstrap = function () {
	var instance = this;

	instance.handlers();
	instance.checkForStart();

	console.log('Server started on port ' + instance.SETTINGS.serverPort + '. URL: http://' + instance.SETTINGS.serverAddress + ':' + instance.SETTINGS.serverPort + '/');
};

GameServer.prototype.handlers = function () {
	var instance = this;

	instance.IO.sockets.on(CONST.SOCKET_CONNECTION, function (socket) {
		var socketId = socket.id;

		instance.onConnectionHandler(socket);

		socket.on(CONST.SOCKET_DISCONNECTED, function (data) {
			instance.onDisconnectHandler(data, socketId);
		});

		socket.on(CONST.SOCKET_SIGNUP, function (data) {
			instance.onSignupHandler(data, socket);
		});


		socket.on(CONST.SOCKET_UPDATE_GRID, function (data) {
			instance.onUpdateGridHandler(data, socket);
		});

		socket.on(CONST.SOCKET_MOVE, function (data) {
			instance.onMoveHandler(data, socket);
		});
	});

	instance.DASHBOARD
		.of('/dashboard')
  		.on(CONST.SOCKET_CONNECTION, function (socket) {
  			instance.dashBoardSocket = socket;
		});
};

GameServer.prototype.onConnectionHandler = function (socket) {
	var instance = this,
		socketId = socket.id;

	instance.broadCastSocket = socket;

	if (instance.GAME.started) {
		socket.emit(CONST.SOCKET_WAIT_NEXT_GAME, {
			success: true
		});

		return false;
	}

	socket.emit(CONST.SOCKET_CONNECTED, {
		id: socketId
	});
};

GameServer.prototype.onDisconnectHandler = function (data, socketId) {
	var instance = this;

	delete instance.GAME.players[socketId];

	instance.dashBoardSync();
};

GameServer.prototype.onMoveHandler = function (data, socket) {
	var instance = this;

	if (instance.GAME.started == true) {
		var playerId = data.id,
			player = instance.GAME.players[playerId];

		if (player) {
			player.position += instance.GAME.stepSize;

			if (player.position >= instance.GAME.screenSize) {
				player.position = instance.GAME.screenSize - instance.GAME.playerSize;

				instance.finishGame(playerId);
			} else {
				instance.dashBoardSync();
			}
		}
	}
};

GameServer.prototype.onUpdateGridHandler = function (data, socket) {
	var instance = this;

	socket.emit(CONST.SOCKET_UPDATE_GRID, {
		success: true,
		result: {
			players: instance.GAME.players,
			total: instance.totalPlayers()
		}
	});
};

GameServer.prototype.onSignupHandler = function (data, socket) {
	var instance = this;

	if (data) {
		if (data.id && data.userName && data.avatar) {
			var socketId = data.id,
				user = {
					id: socketId,
					userName: data.userName,
					avatar: data.avatar,
					position: 0
				};

			instance.GAME.players[socketId] = user;

			socket.emit(CONST.SOCKET_SIGNUP, {
				success: true,
				result: user
			});

			socket.broadcast.emit(CONST.SOCKET_NEW_PLAYER, {
				userName: user.userName
			});

			if (instance.dashBoardSocket) {
				instance.dashBoardSocket.emit(CONST.SOCKET_NEW_PLAYER, {
					userName: user.userName
				});
			}

			if (instance.GAME.starting) {
				instance.broadCastMessage(CONST.SOCKET_PREPARE_START_RACE, {
					success: true
				});

				instance.resetStartGame();
			}

			instance.dashBoardSync();
		}
		else {
			socket.emit(CONST.SOCKET_SIGNUP, {
				success: false,
				message: 'Os dados estão inválidos. Recarregue a página e tente novamente',
				result: false
			});
		}
	}
};

GameServer.prototype.checkForStart = function () {
	var instance = this;

	console.log('Checando jogadores necessários...');

	instance.TIME_checkForStart = setInterval(function () {
		if (instance.GAME.started == false) {
			var total = instance.totalPlayers();

			if (total >= instance.GAME.minPlayers) {

				instance.broadCastMessage(CONST.SOCKET_PREPARE_START_RACE, {
					success: true
				});

				instance.dashBoardSync();
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

GameServer.prototype.broadCastMessage = function (socket, data) {
	var instance = this;

	instance.broadCastSocket.broadcast.emit(socket, data);
	instance.broadCastSocket.emit(socket, data);
};

GameServer.prototype.startGame = function () {
	var instance                 = this,
		date                     = new Date();

	instance.GAME.freezetime = instance.SETTINGS.freezetime;
	instance.GAME.starting 	 = true;
	instance.GAME.started    = false;

	instance.TIME_freezeTime = setInterval(function () {
		instance.GAME.freezetime--;

		if (instance.GAME.freezetime > 0) {
			instance.broadCastMessage(CONST.SOCKET_FREEZETIME, {
				timeLeft: instance.GAME.freezetime,
				success: true
			});
		}
		else {
			instance.GAME.started = true;
			instance.GAME.createdAt = date.getTime();

			instance.broadCastMessage(CONST.SOCKET_START_RACE, {
				game: instance.GAME,
				success: true
			});

			clearInterval(instance.TIME_freezeTime);
		}
	}, 1000);

};

GameServer.prototype.resetStartGame = function () {
	var instance = this;

	clearInterval(instance.TIME_freezeTime);
	instance.startGame();
};

GameServer.prototype.finishGame = function (winnerId) {
	var instance = this;

	instance.GAME.finished  = true;
	instance.GAME.createdAt = false;
	instance.GAME.winner    = winnerId;

	instance.broadCastMessage(CONST.SOCKET_FINISH, {
		success: true,
		game: instance.GAME
	});

	instance.dashBoardScore();
};

GameServer.prototype.totalPlayers = function () {
	var instance = this,
		players = 0;

	for (player in instance.GAME.players) players++;

	return parseInt(players);
};


GameServer.prototype.dashBoardSync = function () {
	var instance = this;

	if (instance.dashBoardSocket) {
		instance.dashBoardSocket.emit(CONST.SOCKET_STATS, {
			success: true,
			result: instance.GAME.players,
			game: instance.GAME
		});
	}
};

GameServer.prototype.dashBoardScore = function () {
	var instance = this;

	if (instance.dashBoardSocket) {
		instance.dashBoardSocket.emit(CONST.SOCKET_SHOW_SCORE, {
			success: true,
			game: instance.GAME
		});
	}

	delete instance.GAME;
	instance.GAME = ce.clone(instance.SETTINGS.game);
	instance.checkForStart();
};

new GameServer();