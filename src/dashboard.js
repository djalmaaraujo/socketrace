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

		instance.socketServer = io.connect('http://' + instance.settings.serverAddress + ':' + instance.settings.serverPort + '/dashboard');

		instance.handlers();
	};

	DashBoardRace.prototype.handlers = function () {
		var instance = this;

		instance.socketServer.on(CONST.SOCKET_STATS, function (data) {
			var resultPlayers    = data.result,
				raceViewTemplate = $(CONST.TPL_RACE_VIEW).html(),
				template         = Handlebars.compile(raceViewTemplate),
				html             = '';

			$.each(resultPlayers, function (index, item) {
				html += template({
					avatar_path: CONST.AVATARS_PATH,
					profile: item
				});
			});

			$(CONST.DOM_RACE_PLAYERS).html(html);
		});

		instance.socketServer.on(CONST.SOCKET_NEW_PLAYER, function (data) {
			instance.showAlert({message: CONST.MESSAGE_NEW_PLAYER + data.userName});
		});

		instance.socketServer.on(CONST.SOCKET_SHOW_SCORE, function (data) {
			instance.showScore(data);
		});
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
			scoreViewTemplate = $(CONST.TPL_RACE_SCORE_VIEW).html(),
			template          = Handlebars.compile(scoreViewTemplate),
			html              = '',
			players           = data.game.players;

		players.sort(function (p1, p2) {
			if (p1.position == p2.position) return 0;
			return (p1.position < p2.position);
		});

		$.each(players, function (index, item) {
			item.position = 0;
			html += template({
				avatar_path: CONST.AVATARS_PATH,
				profile: item
			});
		});

		$(CONST.DOM_RACE_STATS_VIEW).hide();
		$(DOM_SCORE_RACE_PLAYERS).html(html);
		$(CONST.DOM_SCORE_VIEW).show();
	};

	new DashBoardRace();
})();