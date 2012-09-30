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

(function (SOCKETRACE_CONFIG, SOCKETRACE_CONSTANTS) {
	var CONST = SOCKETRACE_CONSTANTS;

	/**
	 *
	 * Game Base
	 *
	 **/
	var SocketRace = function () {
		var instance = this;


		instance.settings = SOCKETRACE_CONFIG;
		instance.views    = {
			'all'	: $(CONST.VIEW),
			'signup': $(CONST.DOM_SIGNUP_VIEW),
			'grid'	: $(CONST.DOM_GRID_VIEW),
			'race'	: $(CONST.DOM_RACE_VIEW),
			'score'	: $(CONST.DOM_SCORE_VIEW),
			'next'	: $(CONST.DOM_NEXT_GAME_VIEW)
		};

		instance.bootstrap();
	};

	SocketRace.prototype.bootstrap = function () {
		var instance = this;

		instance.socketServer = io.connect('http://' + instance.settings.serverAddress + ':' + instance.settings.serverPort + '/');

		instance.handlers();

		instance.showView(CONST.SIGNUP);
	};

	SocketRace.prototype.handlers = function () {
		var instance = this;

		instance.socketServer.on(CONST.SOCKET_CONNECTED, function (data) {
			if (data) {
				if (data.id) {
					instance.socketId = data.id;
				}
			}

			instance.showAlert({message: CONST.MESSAGE_CONNECTED});
		});

		instance.socketServer.on(CONST.SOCKET_WAIT_NEXT_GAME, function (data) {
			instance.waitForNextGame(data);
		});

		instance.socketServer.on(CONST.SOCKET_SIGNUP, function (data) {
			instance.handleSignupRequest(data);
		});

		instance.socketServer.on(CONST.SOCKET_NEW_PLAYER, function (data) {
			instance.showAlert({message: CONST.MESSAGE_NEW_PLAYER + data.userName});
		});

		instance.socketServer.on(CONST.SOCKET_FREEZETIME, function (data) {
			instance.handleFreezeTime(data);
		});

		instance.socketServer.on(CONST.SOCKET_UPDATE_GRID, function (data) {
			if (instance.currentView == CONST.GRID) {
				instance.updateGridScreen(data);
			} else {
				clearTimeout(instance.updateGridTimer);
			}
		});

		instance.socketServer.on(CONST.SOCKET_PREPARE_START_RACE, function (data) {
			instance.prepareRace(data);
		});

		instance.socketServer.on(CONST.SOCKET_START_RACE, function (data) {
			instance.startRace(data);
		});

		instance.socketServer.on(CONST.SOCKET_FINISH, function (data) {
			instance.finishGame(data);
		});

		$(CONST.DOM_SIGNUP_FORM).on(CONST.SUBMIT, function (e) {
			instance.signupHandler(e);
			e.preventDefault();
		});
	};

	SocketRace.prototype.signupHandler = function (event) {
		var instance = this,
			userName = $(CONST.DOM_SIGNUP_FORM).find(CONST.DOM_INPUT_USER_NAME).val(),
			avatar   = $(CONST.DOM_SIGNUP_FORM).find(CONST.DOM_INPUT_AVATAR).val();

		if (!!userName && !!avatar) {
			instance.showAlert({
				message: CONST.MESSAGE_SIGNUP_LOADING,
				dontErase: true
			});

			instance.socketServer.emit(CONST.SOCKET_SIGNUP, {
				id: instance.socketId,
				userName: userName,
				avatar: avatar
			});
		}
		else {
			instance.showAlert({message: CONST.MESSAGE_VALIDATION_FIELDS});
			$(CONST.DOM_INPUT_USER_NAME).focus();
		}
	};

	SocketRace.prototype.handleSignupRequest = function (data) {
		var instance = this;

		if (data.success) {
			instance.player            = new Player();

			instance.player.data       = data.result;
			instance.player.connected  = true;
			instance.player.position   = 0;
			instance.player.socketId   = instance.socketId;
			instance.player.superClass = instance;

			instance.showGridScreen();
		}
		else {
			instance.showAlert(data);
		}
	};

	SocketRace.prototype.showAlert = function (data) {
		var instance = this;

		$(CONST.MESSAGE_BOX)
			.show()
			.html(data.message);

		if (!data.dontErase) {
			window.messageAlert = setTimeout(function () {
				$(CONST.MESSAGE_BOX).html('');
			}, 2000);
		}
	};

	SocketRace.prototype.showView = function (view) {
		var instance = this;

		if (SocketRace.prototype.hasOwnProperty(CONST.BEFORE_SHOW + view)) {
			instance[CONST.BEFORE_SHOW + view].call(instance, arguments);
		}

		instance.views.all
			.removeClass(CONST.CURRENT)
			.hide();

		instance.views[view]
			.addClass(CONST.CURRENT)
			.show();

		instance.currentView = view;

		if (SocketRace.prototype.hasOwnProperty(CONST.AFTER_SHOW + view)) {
			instance[CONST.AFTER_SHOW + view].call(instance, arguments);
		}
	};

	SocketRace.prototype.showGridScreen = function () {
		var instance = this;

		$(CONST.MESSAGE_BOX).html('');
		instance.showView('grid');
	};

	SocketRace.prototype.updateGridScreen = function (data) {
		var instance = this;

		if (!data) {
			instance.socketServer.emit(CONST.SOCKET_UPDATE_GRID, {
				player: instance.player.data
			});
		}
		else {
			if (data.success) {
				var resultPlayers    = data.result.players,
					gridViewTemplate = $(CONST.TPL_GRID_VIEW).html(),
					template         = Handlebars.compile(gridViewTemplate),
					players          = [];

				delete resultPlayers[instance.player.socketId];

				var html = template({
						profile: instance.player.data,
						slots: (instance.settings.maxPlayers-1) - data.result.total,
						avatar_path: CONST.AVATARS_PATH,
						players: players
					});

				$(CONST.DOM_GRID_VIEW_CONTENT).html(html);
			}

			clearTimeout(instance.updateGridTimer);
			instance.updateGridTimer = setTimeout(function () {
				instance.updateGridScreen();
			}, 1000);
		}
	};

	SocketRace.prototype.startRace = function (data) {
		var instance 	 = this,
			player       = instance.player,
			game         = data.game;

		if (data.success) {
			$(CONST.DOM_RACE_CONTROLS).on('touchstart', function (e) {
				var self = $(e.target);

				$(CONST.DOM_RACE_CONTROLS).removeClass(CONST.SELECTED);

				self.addClass(CONST.SELECTED);
				instance.player.move(self);
				e.preventDefault();
			});

			$(CONST.DOM_RACE_CONTROLS).parent().show();

			instance.views.race.find(CONST.H3).html(CONST.MESSAGE_GOGOGO);
			instance.showAlert({message: CONST.MESSAGE_GOGOGO});
		}
	};

	SocketRace.prototype.handleFreezeTime = function (data) {
		var instance = this;

		instance.showAlert({
			dontErase: true,
			message: CONST.MESSAGE_FREEZETIME + data.timeLeft + CONST.POINTS
		});

		$(CONST.DOM_RACE_VIEW).find(CONST.H3).html(CONST.RACE_H3_DEFAULT_TEXT + CONST.STR_BLANK + data.timeLeft + CONST.POINTS);
	};

	SocketRace.prototype.prepareRace = function (data) {
		var instance 	 = this,
			raceTemplate = $(CONST.TPL_RACE_VIEW).html(),
			template     = Handlebars.compile(raceTemplate);

		clearTimeout(instance.updateGridTimer);

		if (data.success) {
			var html = template({
					avatar_path: CONST.AVATARS_PATH,
					profile: instance.player.data
				});

			$(CONST.DOM_RACE_VIEW_CONTENT).html(html);

			instance.showView('race');
		}
	};

	SocketRace.prototype.finishGame = function (data) {
		var instance = this,
			game 	 = data.game;

		$(CONST.DOM_RACE_CONTROLS).off('touchstart');

		instance.showScore(data);
	};

	SocketRace.prototype.showScore = function (data) {
		var instance          = this,
			winner            = data.game.players[data.game.winner],
			scoreViewTemplate = $(CONST.TPL_RACE_SCORE_VIEW).html(),
			template          = Handlebars.compile(scoreViewTemplate),
			html              = '',
			players           = [];

		$.each(data.game.players, function (index, item) { players.push(item); });

		players.sort(function (p1, p2) {
			if (p1.position == p2.position) return 0;
			return (p1.position < p2.position);
		});

		$.each(players, function (index, item) {
			item.position = 0;
			html += template({
				place: (index+1) + ' - ',
				avatar_path: CONST.AVATARS_PATH,
				profile: item
			});
		});

		$(CONST.DOM_SCORE_RACE_PLAYERS).html(html);

		instance.showView('score');
	};

	SocketRace.prototype.waitForNextGame = function (data) {
		var instance = this;

		if (data.success) {
			instance.showView(CONST.NEXT);
		}
	};

	SocketRace.prototype.afterShow_signup = function () {
		var instance        = this,
			avatarsTemplate = $(CONST.TPL_AVATARS_LIST).html(),
			template        = Handlebars.compile(avatarsTemplate),
			html            = template({avatars: CONST.AVATARS});

		$(CONST.DOM_UL_AVATARS).html(html);

		$(CONST.DOM_SIGNUP_FORM_IMAGES).on('touchstart', function (e) {
			var self = $(e.target);

			$(CONST.DOM_INPUT_AVATAR).val(self.data('id'));
			$(CONST.DOM_SIGNUP_FORM_IMAGES).parent().removeClass(CONST.SELECTED);
			self.parent().addClass(CONST.SELECTED);

			e.preventDefault();
		});
	};

	SocketRace.prototype.afterShow_grid = function () {
		var instance = this;

		instance.updateGridScreen();
	};

	/**
	 *
	 * Player
	 *
	 **/
	var Player = function () {
		var instance 	 = this,
			position     = 0,
			connected    = false,
			socketId     = false,
			database     = {};
	};

	Player.prototype.move = function(element) {
		var instance    	= this,
			actualClick     = element.data('rel'),
			move			= false,
			lastClick       = (instance.lastClick) ? instance.lastClick : 'right';

		if ( ((lastClick == 'right') && (actualClick == 'left')) || ((lastClick == 'left') && (actualClick == 'right')) ) {
			instance.superClass.socketServer.emit(CONST.SOCKET_MOVE, {
				id: instance.data.id
			});
		}

		instance.lastClick = actualClick;
	};

	var Game = new SocketRace();
})(SOCKETRACE_CONFIG, SOCKETRACE_CONSTANTS);