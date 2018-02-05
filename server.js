var express = require('express');
var app = express();
var router = express.Router();
var bodyParser = require('body-parser');
var api = require('./routers/api.js'),
    map = require('./routers/map.js'),
    device = require('./routers/device.js');
var config = require('./config');
var broker = require('./modules/broker.js');
var async   = require('async'),
	request = require('request');
// Authentication module. 
var auth = require('http-auth');
var morgan = require('morgan');
var basic = auth.basic({
	realm: "Node JS API",
    file: "./keys.htpasswd" // gevorg:gpass, Sarah:testpass ... 
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('dev')); // log every request to the console

if(config.auth == true) {
	app.use(auth.connect(basic));
}


app.all('/*', function(req, res, next) {
  // CORS headers
  res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  // Set custom headers for CORS
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
  next();
});

router.get('/', function(req, res) {
	res.json({ message: 'MQTT Broker and API!' });   
});

app.use('/api', api);
app.use('/map', map);
app.use('/device', device);

api = require('./routers/api.js'),

app.use(function(req, res, next) {
	res.status(404);
	res.send({
		"success" : 0,
		"message" : 'Invalid URL'
	});
});

var server = app.listen(config.port, function () {
	console.log(server.address());
	var host = server.address().address;
	var port = server.address().port;
	
	console.log('Server listening at http://localhost:%s', port);
	console.log('api url : http://localhost:8000/api/:table');
});
