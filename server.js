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

var ON_CONNECTION     = 'connection',
	ON_WAIT_NEXT_GAME = 'waitForNextGame',
	ON_DISCONNECT     = 'disconnect',
	ON_CONNECTED      = 'connected',
	ON_SIGNUP         = 'signup',
	ON_NEW_PLAYER     = 'newPlayer',
	ON_UPDATE_GRID    = 'updateGrid',
	ON_MOVE           = 'move',
	ON_PREPARE_RACE   = 'prepareRace',
	ON_FREEZETIME     = 'freezetime',
	ON_START          = 'start',
	ON_SHOW_SCORE     = 'showScore',
	PUBLIC_DIR        = '/public'
	SOCKET_IO         = 'socket.io',
	RAILWAY           = 'railway',
	EXPRESS           = 'express';

var GameServer = function() {
	var	instance  = this;
	var railway;
	var express;
	var app;

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

	railway = require(RAILWAY);

	express = require(EXPRESS);

	app = railway.createServer();

	app.listen(instance.settings.SERVER_PORT);

	instance.IO        = require(SOCKET_IO).listen(app);
	instance.dashboard = instance.IO;

	app.configure(function () {
		var cwd = process.cwd();
		app.use(express.static(cwd + PUBLIC_DIR, {maxAge: 300}));
	});

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

	instance.IO.sockets.on(ON_CONNECTION, function (socket) {
		var socketId = socket.id;

		instance.onConnectionHandler(socket);

		socket.on(ON_DISCONNECT, function (data) {
			instance.onDisconnectHandler(data, socketId);
		});

		socket.on(ON_SIGNUP, function (data) {
			instance.onSignupHandler(data, socket);
		});


		socket.on(ON_UPDATE_GRID, function (data) {
			instance.onUpdateGridHandler(data, socket);
		});

		socket.on(ON_MOVE, function (data) {
			instance.onMoveHandler(data, socket);
		});
	});

	instance.dashboard
		.of('/dashboard')
  		.on('connection', function (socket) {
  			instance.dashBoardSocket = socket;
		});
};

GameServer.prototype.onConnectionHandler = function (socket) {
	var instance = this,
		socketId = socket.id;

	if (!instance.initialSocket) {
		instance.initialSocket = socket;
	}

	if (instance.GAME.started) {
		socket.emit(ON_WAIT_NEXT_GAME, {success: true});
		return false;
	}

	socket.emit(ON_CONNECTED, {
		id: socketId
	});
};

GameServer.prototype.onDisconnectHandler = function (data, socketId) {
	var instance = this;

	delete instance.GAME.players[socketId];

	instance.submitDashBoardStats();
};

GameServer.prototype.onMoveHandler = function (data, socket) {
	var instance = this;

	if (instance.GAME.started == true) {
		var playerId = data.id,
			player = instance.GAME.players[playerId];

		if (player) {
			player.position += 10;

			instance.submitDashBoardStats();
		}
	}
};

GameServer.prototype.submitDashBoardStats = function () {
	var instance = this;

	if (instance.dashBoardSocket) {
		instance.dashBoardSocket.emit('stats', {
			success: true,
			result: instance.GAME.players,
			game: instance.GAME
		});
	}
};

GameServer.prototype.onUpdateGridHandler = function (data, socket) {
	var instance = this;

	socket.emit(ON_UPDATE_GRID, {
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

			socket.emit(ON_SIGNUP, {
				success: true,
				result: user
			});

			socket.broadcast.emit(ON_NEW_PLAYER, {userName: user.userName});
		}
		else {
			socket.emit(ON_SIGNUP, {
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

				instance.initialSocket.broadcast.emit(ON_PREPARE_RACE, {
					success: true
				});

				instance.submitDashBoardStats();
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
			instance.initialSocket.broadcast.emit(ON_FREEZETIME, {
				timeLeft: instance.GAME.freezetime,
				success: true
			});
		}
		else {
			instance.GAME.started = true;
			instance.GAME.created_at = date.getTime();

			instance.initialSocket.broadcast.emit(ON_START, {
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
	instance.initialSocket.broadcast.emit(ON_SHOW_SCORE, {game: instance.GAME});
};

GameServer.prototype.totalPlayers = function () {
	var instance = this,
		players = 0;

	for (player in instance.GAME.players) {
		players++;
	}

	console.log(players);
	return parseInt(players);
};

new GameServer();