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

var	address = '127.0.0.1',
	port = 4000,
	PLAYERS = {};


var io = require('socket.io').listen(port);

io.sockets.on('connection', function (socket) {
	var socketId = socket.id;

	// EMIT connected
	socket.emit('connected', {
		id: socketId
	});


	// ON disconnect
	socket.on('disconnect', function (data) {
		delete PLAYERS[socket.id];
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

				PLAYERS[socketId] = user;

				socket.emit('signup', {
					success: true,
					result: user
				});
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

	socket.on('update_grid', function (data) {

		socket.emit('update_grid', {
			success: true,
			result: {
				players: PLAYERS
			}
		});
	});
});

console.log('Server started on port ' + port + '. URL: http://' + address + ':' + port + '/');