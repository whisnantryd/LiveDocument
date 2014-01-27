var express = require('express');
var app = express();

var srv = require('http').createServer(app);
var io = require('socket.io').listen(srv, { log : false });

var fs = require('fs')

var files = {};
var clientCount = 0;

if(undefined == process.argv[2]){
	srv.listen(50000);
}
else{
	srv.listen(process.argv[2]);
}

/* web socket/ajax fallback */
io.sockets.on('connection', function (socket) {
	clientCount++;
	
	socket.on('disconnect', function () {
		clientCount--;
	});
	
	for (var i in files){
		socket.emit(i, files[i]);
	}
});

/* rest server */
/* app.use(express.basicAuth('user', 'password')); */

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/', function(req, res) {
	fs.readFile(__dirname + '/example.html', function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading example.html');
        }
        
        res.writeHead(200);
        res.end(data.toString().replace(/PORTNUMBER/g, srv.address().port));
    });
});

app.get('/clients/count', function(req, res) {
	res.writeHead(200);
	res.end(JSON.stringify({ ClientCount : clientCount }));
});

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