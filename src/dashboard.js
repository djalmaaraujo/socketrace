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

(function() {
	var CONST = SOCKETRACE_CONSTANTS;

	var DashBoardRace = function () {
		var instance = this;

		instance.settings = SOCKETRACE_CONFIG;

		instance.bootstrap();
	};

	DashBoardRace.prototype.bootstrap = function () {
		var instance = this;

		instance.socketServer = io.connect('http://' + instance.settings.serverAddress + ':' + instance.settings.serverPort);

		instance.handlers();

		instance.requestSync();
	};

	DashBoardRace.prototype.handlers = function () {
		var instance = this;

		instance.socketServer.on(CONST.SOCKET_DASHBOARD_SYNC, function (data) {
			instance.onSyncHandler(data);
		});

		instance.socketServer.on(CONST.SOCKET_NEW_PLAYER, function (data) {
			instance.showAlert({message: CONST.MESSAGE_NEW_PLAYER + data.userName});
		});

		instance.socketServer.on(CONST.SOCKET_FINISH, function (data) {
			instance.showScore(data);
		});

		instance.socketServer.on(CONST.SOCKET_START_RACE, function (data) {
			instance.startGame(data);
		});

		instance.socketServer.on(CONST.SOCKET_FREEZETIME, function (data) {
			instance.handleFreezeTime(data);
		});
	};

	DashBoardRace.prototype.startGame = function (data) {
		var instance = this;

		var pb = 0;
		instance.moveBackGround = setInterval(function () {
			$('body').css({'background-position': (pb-- * 1.2) + 'px 0'});
		}, 10);

		$(CONST.MESSAGE_BOX).html('');
		$(CONST.DOM_RACE_PLAYERS).find('li').css({left: 0});
	};

	DashBoardRace.prototype.requestSync = function () {
		var instance = this;

		instance.socketServer.emit(CONST.SOCKET_DASHBOARD_SYNC, {success: true});
	};

	DashBoardRace.prototype.handleFreezeTime = function (data) {
		var instance = this;

		instance.showAlert({
			dontErase: true,
			message: CONST.RACE_H3_DEFAULT_TEXT + CONST.STR_BLANK + data.timeLeft + CONST.POINTS
		});
	};

	DashBoardRace.prototype.onSyncHandler = function (data) {
		var instance = this,
			raceViewTemplate = $(CONST.TPL_RACE_VIEW).html(),
			template         = Handlebars.compile(raceViewTemplate),
			players          = [],
			html             = '',
			top = 0;

		$.each(data.game.players, function (index, item) { players.push(item); });
		$.each(players, function (index, item) {
			item.position = (data.game.started) ? item.position : item.position + (index*30);

			html += template({
				avatar_path: CONST.AVATARS_PATH,
				profile: item,
				top: index * 35
			});
		});

		$(CONST.DOM_RACE_PLAYERS).html(html);
	};

	DashBoardRace.prototype.showAlert = function (data) {
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

	DashBoardRace.prototype.showScore = function (data) {
		var instance          = this,
			winner            = data.game.players[data.game.winner],
			scoreViewTemplate = $(CONST.TPL_RACE_VIEW).html(),
			template          = Handlebars.compile(scoreViewTemplate),
			html              = '',
			players           = [];

		clearInterval(instance.moveBackGround);

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

		$(CONST.DOM_RACE_STATS_VIEW).hide();
		$(CONST.DOM_SCORE_RACE_PLAYERS).html(html);
		$(CONST.DOM_SCORE_VIEW).show();
	};

	new DashBoardRace();
})();