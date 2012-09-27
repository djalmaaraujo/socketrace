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

	var AVATARS_PATH              = 'assets/images/avatar/',
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
		DOM_RACE_PLAYERS = '#race-players',
		TPL_RACE_VIEW = '#tpl-race-view';

	var DashBoardRace = function () {
		var instance = this;

		instance.settings = {
			serverAddress: '10.0.1.32',
			serverPort: '4000',
			maxPlayers: 10 // in miliseconds
		};

		instance.bootstrap();
	};

	DashBoardRace.prototype.bootstrap = function () {
		var instance = this;

		instance.socketServer = io.connect('http://' + instance.settings.serverAddress + ':' + instance.settings.serverPort + '/dashboard');

		instance.handlers();
	};

	DashBoardRace.prototype.handlers = function () {
		var instance = this;

		instance.socketServer.on('stats', function (data) {
			var resultPlayers    = data.result,
				raceViewTemplate = $(TPL_RACE_VIEW).html(),
				template         = Handlebars.compile(raceViewTemplate),
				html = '';

			$.each(resultPlayers, function (index, item) {
				html += template({
					avatar_path: AVATARS_PATH,
					profile: item
				})
			});

			$(DOM_RACE_PLAYERS).html(html);
		});
	};

	new DashBoardRace();
})();