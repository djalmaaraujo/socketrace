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

(function () {

	var AFTER_SHOW                = 'afterShow_',
		AVATARS_PATH              = 'assets/images/avatar/',
		AVATARS                   = [
			{
				id: 'homer',
				name: 'Homer :P',
				src: AVATARS_PATH + 'homer',
				selected: 'selected'
			},

			{
				id: 'lisa',
				name: 'Lisa               =)',
				src: AVATARS_PATH + 'lisa'
			},
			{
				id: 'bart',
				name: 'Bart O.o',
				src: AVATARS_PATH + 'bart'
			},
			{
				id: 'marge',
				name: 'Marge ^^',
				src: AVATARS_PATH + 'marge'
			}
		],
		BEFORE_SHOW               = 'beforeShow_',
		CURRENT                   = 'current',
		CLICK                     = 'click',
		DOM_GRID_VIEW_CONTENT = '.grid-view-content',
		DOM_INPUT_USER_NAME       = '#userName',
		DOM_INPUT_AVATAR          = '#avatar',
		DOM_SIGNUP_FORM           = '#signup-form',
		DOM_SIGNUP_FORM_IMAGES    =  DOM_SIGNUP_FORM + ' ul li img',
		DOM_UL_AVATARS            = 'ul.avatars',
		SOCKET_FINISH_RACE        = 'finish_race',
		GRID                      = 'grid',
		MESSAGE_BOX               = '.message-box',
		MESSAGE_CONNECTED         = 'Você está conectado, escolha seu nome e avatar',
		MESSAGE_DISCONNECTED      = 'O jogo acabou! Bye ;)',
		MESSAGE_SIGNUP_LOADING    = 'Aguarde.. registrando sua conta..',
		MESSAGE_VALIDATION_FIELDS = 'Preencha seu nome e escolha um avatar',
		REGISTER_SUCCESS          = 'register_success',
		SELECTED                  = 'selected',
		SIGNUP                    = 'signup',
		SOCKET_CONNECTED          = 'connected',
		SOCKET_NEW_PLAYER         = 'new_player',
		SOCKET_SHOW_SCORE         = 'show_score',
		SOCKET_START_RACE         = 'start_race',
		SOCKET_UPDATE_GRID        = 'update_grid',
		SUBMIT                    = 'submit',
		TPL_AVATARS_LIST          = '#tpl-avatar-list',
		TPL_GRID_VIEW             = '#tpl-grid-view';

	/**
	 *
	 * Game Base
	 *
	 **/
	var SocketRace = function () {
		var instance = this;

		instance.settings = {
			serverAddress: '127.0.0.1',
			serverPort: '4000',
			serverPath: '',
			maxPlayers: 10,
			freezeTime: 5000 // in miliseconds
		};

		instance.views = {
			'all': $('.view'),
			'signup': $('#signup-view'),
			'grid': $('#grid-view'),
			'race': $('#race-view'),
			'score': $('#score-view')
		};

		instance.bootstrap();
	};

	SocketRace.prototype.binds = function () {
		var instance = this;

		instance.socketServer.on(SOCKET_CONNECTED, function (data) {
			if (data) {
				if (data.id) {
					instance.socketId = data.id;
				}
			}

			instance.showAlert({message: MESSAGE_CONNECTED});
		});

		instance.socketServer.on(SIGNUP, function (data) {
			instance.handleSignupRequest(data);
		});

		instance.socketServer.on(SOCKET_NEW_PLAYER, function (data) {
			if (instance.player) {
				if (data.id !== instance.player.socketId) {
					instance.showAlert(data);
				}
			}
		});

		instance.socketServer.on(SOCKET_UPDATE_GRID, function (data) {
			instance.updateGridScreen(data);
		});

		instance.socketServer.on(SOCKET_START_RACE, function (data) {
			instance.startRace(data);
		});

		instance.socketServer.on(SOCKET_FINISH_RACE, function (data) {
			instance.finishRace(data);
		});

		instance.socketServer.on(SOCKET_SHOW_SCORE, function (data) {
			instance.showScore(data);
		});

		$(DOM_SIGNUP_FORM).on(SUBMIT, function (e) {
			instance.signupHandler(e);
			e.preventDefault();
		});
	};

	SocketRace.prototype.bootstrap = function () {
		var instance = this;

		instance.socketServer = io.connect('http://' + instance.settings.serverAddress + ':' + instance.settings.serverPort + '/' + instance.settings.serverPath);

		instance.showView(SIGNUP);
		instance.binds();
	};

	SocketRace.prototype.signupHandler = function (event) {
		var instance = this,
			userName = $(DOM_SIGNUP_FORM).find(DOM_INPUT_USER_NAME).val(),
			avatar = $(DOM_SIGNUP_FORM).find(DOM_INPUT_AVATAR).val();

		if (!!userName && !!avatar) {
			instance.showAlert({
				message: MESSAGE_SIGNUP_LOADING,
				dontErase: true
			});

			instance.socketServer.emit(SIGNUP, {
				id: instance.socketId,
				userName: userName,
				avatar: avatar
			});
		}
		else {
			instance.showAlert({message: MESSAGE_VALIDATION_FIELDS});
			$(DOM_INPUT_USER_NAME).focus();
		}
	};

	SocketRace.prototype.handleSignupRequest = function (data) {
		var instance = this;

		if (data.success) {
			instance.player                 = new Player();

			instance.player.database        = data.result;
			instance.player.connected       = true;
			instance.player.position        = 0;
			instance.player.socketId        = instance.socketId;

			instance.showGridScreen();
		}
		else {
			instance.showAlert(data);
		}
	};

	SocketRace.prototype.getAvatar = function (id) {
		var instance = this;

		$.each(AVATARS, function (index, item) {
			var avatar = AVATARS[index];
			if (avatar.id == id) {
				return false;
			}
		});

		return avatar;
	};

	SocketRace.prototype.showAlert = function (data) {
		var instance = this;

		$(MESSAGE_BOX)
			.show()
			.html(data.message);

		if (!data.dontErase) {
			window.messageAlert = setTimeout(function () {
				$(MESSAGE_BOX).html('');
			}, 2000);
		}
	};

	SocketRace.prototype.showView = function (view) {
		var instance = this;

		if (SocketRace.prototype.hasOwnProperty(BEFORE_SHOW + view)) {
			instance[BEFORE_SHOW + view].call(instance, arguments);
		}

		instance.views.all
			.removeClass(CURRENT)
			.hide();

		instance.views[view]
			.addClass(CURRENT)
			.show();

		if (SocketRace.prototype.hasOwnProperty(AFTER_SHOW + view)) {
			instance[AFTER_SHOW + view].call(instance, arguments);
		}
	};

	SocketRace.prototype.showGridScreen = function () {
		var instance = this;

		$(MESSAGE_BOX).html('');

		instance.showView('grid');
	};

	SocketRace.prototype.updateGridScreen = function (data) {
		var instance = this;

		if (!data) {
			instance.socketServer.emit(SOCKET_UPDATE_GRID, {
				player: instance.player.database
			});
		}
		else {
			if (data.success) {
				var resultPlayers = data.result.players,
					gridViewTemplate = $(TPL_GRID_VIEW).html(),
					template = Handlebars.compile(gridViewTemplate),
					players = [];

				delete resultPlayers[instance.player.socketId];

				$.each(resultPlayers, function (index, item) {
					players.push(item);
				});

				console.log(players);

				var html = template({
						profile: instance.player.database,
						slots: instance.settings.maxPlayers - players.length,
						avatar_path: AVATARS_PATH,
						players: players
					});

				$(DOM_GRID_VIEW_CONTENT).html(html);
			}

			setTimeout(function () {
				instance.updateGridScreen();
			}, 1000);
		}
	};

	SocketRace.prototype.startRace = function (data) {};

	SocketRace.prototype.finishRace = function (data) {};

	SocketRace.prototype.showScore = function (data) {
		var instance = this;

		instance.showView('score');

		if (data.players.length > 0) {

		}
	};

	SocketRace.prototype.afterShow_signup = function () {
		var instance = this,
			avatarsTemplate = $(TPL_AVATARS_LIST).html(),
			template = Handlebars.compile(avatarsTemplate),
			html = template({avatars: AVATARS});

		$(DOM_UL_AVATARS).html(html);

		$(DOM_SIGNUP_FORM_IMAGES).on(CLICK, function (e) {
			var self = $(e.target);

			$(DOM_INPUT_AVATAR).val(self.data('id'));
			$(DOM_SIGNUP_FORM_IMAGES).parent().removeClass(SELECTED);
			self.parent().addClass(SELECTED);

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

	Player.prototype.handleTouch = function () {

	};

	Player.prototype.move = function(x) {
		var instance = this;
	};

	var Game = new SocketRace();
})();