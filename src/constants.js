/*
MIT License
===========

Copyright (c) 2012 Djalma Araújo <djalma.araujo@gmail.com>

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

(function(global) {
	var CONSTANTS = {
		AFTER_SHOW: 'afterShow_',
		AVATARS_PATH: 'assets/images/players/',
		AVATARS: [
			{
				id: 'strong_man',
				name: 'Strong Man',
				src: 'assets/images/players/strong_man',
				selected: 'selected'
			},

			{
				id: 'music_man',
				name: 'Music Man',
				src: 'assets/images/players/music_man'
			},
			{
				id: 'style_guy',
				name: 'Style Guy',
				src: 'assets/images/players/style_guy'
			},
			{
				id: 'skate_man',
				name: 'Skate Man',
				src: 'assets/images/players/skate_man'
			}
		],

		BEFORE_SHOW: 'beforeShow_',
		CURRENT: 'current',
		CLICK: 'click',

		DOM_GRID_VIEW_CONTENT: '.grid-view-content',
		DOM_GRID_VIEW: '#grid-view',
		DOM_NEXT_GAME_VIEW: "#next-game-view",
		DOM_INPUT_USER_NAME: '#userName',
		DOM_INPUT_AVATAR: '#avatar',
		DOM_RACE_CONTROLS: '#race-view .controls button',
		DOM_RACE_PLAYERS: '#race-players',
		DOM_RACE_VIEW: '#race-view',
		DOM_RACE_STATS_VIEW: '#race-stats-view',
		DOM_RACE_VIEW_CONTENT: '.race-view-content',
		DOM_SCORE_VIEW: '#score-view',
		DOM_SCORE_RACE_PLAYERS: '#score-race-players',
		DOM_SIGNUP_FORM: '#signup-form',
		DOM_SIGNUP_FORM_IMAGES: '#signup-form ul li img',
		DOM_SIGNUP_VIEW: '#signup-view',
		DOM_UL_AVATARS: 'ul.avatars',

		GRID: 'grid',
		H3: 'h3',

		MESSAGE_BOX: '.message-box',
		MESSAGE_CONNECTED: 'Você está conectado, escolha seu nome e avatar',
		MESSAGE_DISCONNECTED: 'O jogo acabou! Bye ;)',
		MESSAGE_FREEZETIME: 'Iniciando em: ',
		MESSAGE_GOGOGO: 'Valendo!!',
		MESSAGE_SIGNUP_LOADING: 'Aguarde.. registrando sua conta..',
		MESSAGE_VALIDATION_FIELDS: 'Preencha seu nome e escolha um avatar',
		MESSAGE_NEW_PLAYER: 'Novo jogador conectado: ',

		NEXT: 'next',
		RACE: 'race',
		RACE_H3_DEFAULT_TEXT: 'Prepare-se',
		REGISTER_SUCCESS: 'register_success',
		SELECTED: 'selected',
		SIGNUP: 'signup',
		STR_BLANK: ' ',

		SOCKET_CONNECTED: 'connected',
		SOCKET_CONNECTION: 'connection',
		SOCKET_DISCONNECTED: 'disconnect',
		SOCKET_FREEZETIME: 'freezetime',
		SOCKET_FINISH: 'finish',
		SOCKET_MOVE: 'move',
		SOCKET_NEW_PLAYER: 'newPlayer',
		SOCKET_SIGNUP: 'signup',
		SOCKET_SHOW_SCORE: 'showScore',
		SOCKET_START_RACE: 'start',
		SOCKET_STATS: 'dashboardSync',
		SOCKET_PREPARE_START_RACE: 'prepareRace',
		SOCKET_UPDATE_GRID: 'updateGrid',
		SOCKET_WAIT_NEXT_GAME: 'waitForNextGame',

		SOCKET_IO: 'socket.io',
		SUBMIT: 'submit',

		TPL_AVATARS_LIST: '#tpl-avatar-list',
		TPL_GRID_VIEW: '#tpl-grid-view',
		TPL_RACE_VIEW: '#tpl-race-view',
		TPL_RACE_SCORE_VIEW: '#tpl-race-score-view',

		POINTS: '...',
		VIEW: '.view'
	};

	global.SOCKETRACE_CONSTANTS = CONSTANTS;
})(typeof global === "undefined" ? window : exports);