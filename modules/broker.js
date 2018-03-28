var config = require('../config');
var mosca = require('mosca')
var util = require('./util.js');
var mysqlTool = require('./mysqlTool.js');
var mongoMap = require('./mongoMap.js');
var alert = require('./alert.js');
//var amqpAlert = require('./amqpAlert');

var debug = util.isDebug();
var isAuth = util.isAuth();
var checkMacData = {};
var checkNotifyData = {};
var checkDevice = [];

function init () {
  var sql = 'SELECT * FROM cloudb.api_device_info WHERE 1';
  checkDevice = [];
  mysqlTool.query(sql, function(err, deviceList){
    deviceList.forEach( function(device){
      try {
        let mac = device.device_mac;
        // console.log('mac : ' + mac);
        checkDevice.push(mac);
      } catch (error) {
        console.log('???? checkNewDevice err: ' + err);
      }
    });
    console.log('checkDevice mac : ' + JSON.stringify(checkDevice));
  });
}

init();

var ascoltatore = {
  //using ascoltatore
  type: 'mongo',
  url: 'mongodb://localhost:27017/mqtt',
  pubsubCollection: 'ascoltatori',
  mongo: {}
};

var moscaSettings = {
  port: config.mqttPort,
  /*backend: ascoltatore,
  persistence: {
    factory: mosca.persistence.Mongo,
    url: 'mongodb://localhost:27017/mqtt'
  }*/
};
var mongoDB = config.mongoDB;
var dbHost = config.dbHost;
if (!config.isLocalDB) {
    mongoDB = config.test_mongoDB;
    dbHost = config.test_dbHost;
}

console.log('MQTT BROKER--------------------------------');
console.log('Broker port : ' + moscaSettings.port);
console.log('Broker start time : ' + util.getCurrentTime());
console.log('Broker mysql host : ' + dbHost);
console.log('Broker mongoDB : ' +  mongoDB);
console.log('debug : ' + debug);
console.log('isAuth : ' + isAuth);
console.log('isNeedFiltet : ' + config.isNeedFiltet);
console.log('MQTT BROKER--------------------------------');

// Accepts the connection if the username and password are valid
var authenticate = function(client, username, password, callback) {
  var authorized = (username === 'alice' && password.toString() === 'secret');
  if (authorized) client.user = username;
  callback(null, authorized);
}

// In this case the client authorized as alice can publish to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizePublish = function(client, topic, payload, callback) {
    if (debug) {
      console.log('authorizePublish--------' + util.getCurrentTime());
      console.log(' ' +  client.user);
      console.log('topic : ' +  topic);
      console.log('authorizePublish payload : ' +  payload.toString('utf8'));
    }

    // example topic : GIOT-GW/DL/00001C497BC0C094
    var arr = topic.split('/');
    // Verify
    if (arr.length !== 3) {
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
        console.log('????????????????????????????????????????????????????????????????');
        console.log('mysqlTool.getDevices err:\n' + err);
        callback(null, false); // Check fail
        return;
      }
      if (devices.length > 0) { // Already binded
        if (debug) {
          console.log('gw mac : ' + gwMac + 'already binded');
        }
        callback(null, true);
      } else {
        if (debug) {
          console.log('topic gw mac : ' + gwMac + 'without bind forward publish in debug mode');
        } else {
          console.log('topic gw mac : ' + gwMac + 'without bind drop publish message');
          callback(null, false); // Not bind
        }
      }
    })
}

var authorizeForward = function(client, packet, callback) {
    console.log('*************** ' + util.getCurrentTime() + ' authorizeForward ***************');
    // console.log('user : ' +  client.user);
    // console.log('payload : ' +  packet.payload.toString('utf8'));
    // example topic : GIOT-GW/DL/00001C497BC0C094
    var arr = packet.topic.split('/');
    var isNeedFiltet = config.isNeedFiltet;
    // Verify
    if (arr.length !== 3) {
      return;
    }
    
    var msg = packet.payload.toString('utf8');
    if (msg === 'init') {
      init();
      callback(null, false);
      return;
    } else if (msg === 'filter') {
      isNeedFiltet = true;
    }
    console.log('message type : ' + typeof(msg));
    if (arr[1].includes('UL')  ) { // From Lora message
      if (isNeedFiltet) {
        console.log('#### Has frameCount filter');
        if (checkMacData === undefined || checkMacData === null) {
            checkMacData = {};
        }
        var obj = util.getDataJson(msg, checkMacData);

        if (obj === null) {
          //Repeat data to drop
          console.log('Check by memory data : Has same data');
          callback(null, true);
          return;
        } else {
          //No repeat to update check data
          checkMacData[obj.macAddr] = obj;
        }
        return;
        console.log('check data by database ');
      } else {
        // console.log('#### Bypass frameCount filter');
      }
      
      // Check data by data json in database
      // Avoid double data in same time
      util.checkAndParseMessage(isNeedFiltet, msg, function(err, message){

        if(err) {
          if(debug) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        } else {
          if (message) {
            console.log(util.getCurrentTime() + ' *** Publish parse message and save');
            packet.payload = JSON.stringify(message);
            //Jason add for check is new device or not? ----- start
            console.log('checkDevice.includes(message.macAddr) : ' + checkDevice.includes(message.macAddr));
            if (!checkDevice.includes(message.macAddr)) {
              console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
              console.log(util.getCurrentTime() + ' Add new device ' + message.macAddr);
              addNewDevice (message);
              console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
            }
            if (message.extra.fport === 160 || message.extra.fport === 163) {
              if (message.extra.fport === 163) {
                let lastStatus = checkNotifyData[message.macAddr];
                if (lastStatus !== undefined) {
                  if(message.information.status === lastStatus){
                    isSendNotify = false;
                  } else {
                    isSendNotify = true;
                    checkNotifyData[message.macAddr] = message.information.status;
                  }
                } else {
                  isSendNotify = true;
                  checkNotifyData[message.macAddr] = message.information.status
                }
              }  
              if (isSendNotify === true) {
                alert.sendAlert(message);
              }
            }
          }
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

server.on('published', function (packet, client) {
    console.log('------------------------------------------------------------------------');
    console.log(util.getCurrentTime() + ' Published topic: ', packet.topic);
    console.log("payload:\n", packet.payload.toString());
});
//客戶端連接後觸發
server.on('clientConnected', function(client) {
  console.log(util.getCurrentTime() + ' Client Connected ');
  console.log('Client id:' + client.id);
  console.log('-----------------------------------------------------------------------');
});

//客戶端斷開連接後觸發
server.on('clientDisconnected' , function(client) {
  console.log(util.getCurrentTime() + ' Client Disconnected');
  console.log('Client id:', client.id);
  console.log('-----------------------------------------------------------------------');
});

// when client return puback,
/* server.on('delivered', function(packet, client){
  console.log(util.getCurrentTime() + ' Client delivered');
  // console.log(packet.payload.toString());
  console.log('-----------------------------------------------------------------------');
}); */

// MQTT服務端準備完成後觸發
function setup() {
  if (isAuth) {
    console.log('*****************************************');
    console.log('*         User auth flow excute         *');
    console.log('*****************************************');
    server.authenticate = authenticate;
  } else {
    console.log('*****************************************');
    console.log('*         User auth flow no excute      *');
    console.log('*****************************************');
  }

  if (debug === false) {
    console.log('*****************************************');
    console.log('*         check gw flow excute          *');
    console.log('*****************************************');
    server.authorizePublish = authorizePublish;
  } else {
    console.log('*****************************************');
    console.log('*         check gw flow no excute       *');
    console.log('*****************************************');
  }
  server.authorizeForward = authorizeForward;
  // server.authorizeSubscribe = authorizeSubscribe;
  console.log('Mosca server is up and running')
}

function addNewDevice (message) {
  var sql = "INSERT INTO `cloudb`.`api_device_info` ( `device_mac`, `device_name`, `device_status`, `device_type`, `device_share`, `device_active_time`, `device_bind_time`, `device_cp_id`, `device_user_id`, `createTime`, `createUser`) VALUES ( '" 
            + message.macAddr +"', '" + message.macAddr +"', 2, 'L', 0, current_time(), current_time(), 1, 1, current_time(), 1)"
  console.log('addNewDevice sql :\n' + sql);
  mysqlTool.insert(sql, function (err, result) {
    if (err) {
      console.log('addNewDevice + ' + message.maccAddr + ' is err : ' + err);
    } else {
      console.log('addNewDevice + ' + message.maccAddr + ' is finished : ' + result);
      checkDevice.push(message.macAddr);
    }
    
  });
}



