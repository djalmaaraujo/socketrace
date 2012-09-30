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
	var CONFIG = {
		serverAddress: '127.0.0.1',
		serverPort: 4000,
		maxPlayers: 10, // in miliseconds
		freezetime: 10,
		game: {
			screenSize: 800,
			stepSize: 300,
			playerSize: 60,
			starting: false,
			createdAt: false,
			minPlayers: 3,
			mode: 'auto', // auto or manual
			players: {},
			started: false,
			winner: false
		}
	};

	global.SOCKETRACE_CONFIG = CONFIG;
})(typeof global === "undefined" ? window : exports);