var express = require('express');
var app = express();

var srv = require('http').createServer(app);
var io = require('socket.io').listen(srv, { log : false });

var fs = require('fs')

var files = {};
var clientCount = 0;
var users = {}
users['test'] = {password : 'test'}
users['webroot'] = {password : 'a'}

srv.listen(process.argv[2] || 50000);

/* web socket/ajax fallback */
io.sockets.on('connection', function (socket) {
	clientCount++;
	
	socket.on('disconnect', function () {
		clientCount--;
	});
	
	for (var i in files){
		socket.emit(i, files[i]);
	}
})

/* rest server */
var unauthorized = function(res) {
  res.statusCode = 401;
  res.setHeader('WWW-Authenticate', 'Basic realm="Authorization Required"');
  res.end('Unauthorized');
}

var checkauth = function(req) {
	var header = req.headers.authorization||'',
      token = header.split(/\s+/).pop()||'',
      auth = new Buffer(token, 'base64').toString(),
      parts = auth.split(/:/),
      username = parts[0],
      password = parts[1];
	
	if(username && password) {
		if(users[username] && password == users[username].password) {
			return true
		}
	}
	
	return false;
}

// app.use(express.basicAuth('user', 'password'));

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  
  next();
})

app.get('/', function(req, res) {
	fs.readFile(__dirname + '/example.html', function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading example.html');
        }
        
        res.writeHead(200);
		res.end(data.toString().replace(/xyz/g, req.headers.host));
    });
})

app.get('/clients/count', function(req, res) {
	res.writeHead(200);
	res.end(JSON.stringify({ ClientCount : clientCount }));
})

app.post('/update/*', function(req, res, next) {
	if(checkauth(req)) {
		next();
	}
	else {
		unauthorized(res);
	}
})

app.post('/update/:filename', function(req, res) {
	req.on('data', function(data) {
		var datastring = data.toString();	
		
		if (files[req.params.filename] != datastring) {
			files[req.params.filename] = datastring;
			io.sockets.emit(req.params.filename, datastring);
		}
		
		res.writeHead(200);
		res.end();
	});
})