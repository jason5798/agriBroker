var mosca = require('mosca')
var util = require('./util.js');
var mysqlTool = require('./mysqlTool.js');
var mongoMap = require('./mongoMap.js');
var debug = true;

var ascoltatore = {
  //using ascoltatore
  type: 'mongo',        
  url: 'mongodb://localhost:27017/mqtt',
  pubsubCollection: 'ascoltatori',
  mongo: {}
};

var moscaSettings = {
  port: 1883,
  /*backend: ascoltatore,
  persistence: {
    factory: mosca.persistence.Mongo,
    url: 'mongodb://localhost:27017/mqtt'
  }*/
};

// Accepts the connection if the username and password are valid
var authenticate = function(client, username, password, callback) {
  var authorized = (username === 'alice' && password.toString() === 'secret');
  if (authorized) client.user = username;
  callback(null, authorized);
}

// In this case the client authorized as alice can publish to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizePublish = function(client, topic, payload, callback) {
    console.log('authorizePublish--------------------------'); 
    // console.log('user : ' +  client.user);
    // console.log('topic : ' +  topic);
    // console.log('authorizePublish payload : ' +  payload.toString('utf8'));

    // example topic : GIOT-GW/DL/00001C497BC0C094
    var arr = topic.split('/');
    // Verify
    if (arr.length !== 2) {
      callback(null, false);
      return;
    }
    var gwMac = topic.split('/')[2];
    // Jason add for check gw is bind or not?
    // Mac length is 12 in database
    var length= gwMac.length - 12;
    gwMac = gwMac.toUpperCase().slice(length);
    // Find device by mac of gate way
    mysqlTool.getDevices(gwMac, function(err, devices){
      if (err) {
       callback(null, false); // Check fail
      }
      if (devices.length > 0) { // Already binded
        callback(null, true);
      } else {
        callback(null, false); // Not bind   
      }
    })
}

var authorizeForward = function(client, packet, callback) {
    console.log('authorizeForward--------------------------');  
    // console.log('user : ' +  client.user);
    // console.log('payload : ' +  packet.payload.toString('utf8'));
    // example topic : GIOT-GW/DL/00001C497BC0C094
    var arr = packet.topic.split('/');
    // Verify
    if (arr.length !== 3) {
      return;
    }
    var msg = packet.payload.toString('utf8');
    if (arr[1].includes('UL')  ) { // From Lora message
      util.checkAndParseMessage(msg, function(err, message){
        if(err) {
          console.log('Drop repeat message');
          callback(null, null);
        } else {
          console.log('Publish parse message');
          packet.payload = JSON.stringify(message);
          callback(null, true);
        }
      });
    } else {
      callback(null, true);
    }
}

// In this case the client authorized as alice can subscribe to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizeSubscribe = function(client, topic, callback) {
  callback(null, client.user == topic.split('/')[1]);
}

var server = new mosca.Server(moscaSettings);
server.on('ready', setup);

//消息發布後觸發
/* server.on('published', function(packet, client) {
  console.log('Published', packet);
  console.log('Client', client);
}); */
server.on('published', function (packet, client) {
    console.log('Published topic: ', packet.topic);
    // console.log('Published message: ', packet.payload.toString('utf8'));
    
    /* switch (packet.topic) {
        case 'test':
            console.log("payload: ", packet.payload.toString());
            var test = packet.payload.toString() + 'test';
            var msg = {
                topic: 'test',
                payload:  '5678' ,
                qos: 1,
                retain: false
            };
            server.publish(msg, function () {
                console.log('repeat! ');
            });
            break;
    } */
});
//客戶端連接後觸發
server.on('clientConnected', function(client) {
  console.log('Client Connected:', client.id);
});

//客戶端斷開連接後觸發
server.on('clientDisconnected' , function(client) {
 console.log('Client Disconnected:', client.id);
});

// when client return puback,
server.on('delivered', function(packet, client){
  console.log('Delivered', packet.payload.toString());
});

// MQTT服務端準備完成後觸發
function setup() {
  server.authenticate = authenticate;
  if (debug === false) {
    server.authorizePublish = authorizePublish;
  }
  server.authorizeForward = authorizeForward;
  // server.authorizeSubscribe = authorizeSubscribe;
  console.log('Mosca server is up and running')
}




