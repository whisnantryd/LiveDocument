var srv = require('http').createServer(handler);
var io = require('socket.io').listen(srv);
var fs = require('fs')

var express = require('express');
var app = express();

var files = {};

srv.listen(50000);

/* web server */
function handler (req, res) {
    fs.readFile(__dirname + '/example.html', function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading example.html');
        }
        
        res.writeHead(200);
        res.end(data);
    });
}

/* web socket/ajax fallback */
io.sockets.on('connection', function (socket) {
	for (var i in files){
		socket.emit(i, files[i]);
	}
});

/* rest server */
app.use(express.basicAuth('user', 'password'));

app.options('/', function(req, res) {
	res.header("Access-Control-Allow-Origin", req.headers.origin);
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.end('');
});

app.all('/update/', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
 });

app.post('/update/:filename', function(req, res) {
	console.log('update ' + req.params.filename);
	
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

app.listen(50001);








