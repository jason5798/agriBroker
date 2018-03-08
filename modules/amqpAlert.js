var amqp = require('amqp');
var config = require('../config');
// Local references to the exchange, queue and consumer tag
var _exchange = null;
var _queue = null;
var _consumerTag = null;
var test = false;
var options = { host: config.amqpHost,
                port: config.amqpPort,
                login: config.login,
                password: config.password,
                connectionTimeout: 10000,
                authMechanism: 'AMQPLAIN',
                vhost: config.vhost,
                noDelay: true,
                ssl: { enabled : false
                    }
};
if (test) {
    options = { host: 'localhost'
                , port: 5672
                , login: 'guest'
                , password: 'guest'
                , connectionTimeout: 10000
                , authMechanism: 'AMQPLAIN'
                , vhost: '/'
                , noDelay: true
                , ssl: { enabled : false
                    }
            }
}

console.log('AMQP Alert--------------------------------');
console.log('AMQP Host : ' + options.host);
console.log('AMQP Port : ' + options.port);
console.log('AMQP login : ' + options.login);
console.log('AMQP password : ' + options.password);
console.log('AMQP vhost : ' + options.vhost);
console.log('AMQP Alert start time : ' + new Date());
console.log('AMQP test mode : ' + test);
console.log('AMQP Alert--------------------------------');

var connection = amqp.createConnection(options);
/*var connection =
  amqp.createConnection({url: "amqp://jingdfh-test:jingdfh-test@101.37.22.253:5672"});
*/
module.exports = {
    sendAlert
}

// add this for better debuging
connection.on('error', function(e) {
  console.log("Error from amqp: ", e);
});


// Update our stored tag when it changes
connection.on('tag.change', function(event) {
    if (_consumerTag === event.oldConsumerTag) {
        _consumerTag = event.consumerTag;
        // Consider unsubscribing from the old tag just in case it lingers
        _queue.unsubscribe(event.oldConsumerTag);
    }
});

// Initialize the exchange, queue and subscription

if (!test) {
    connection.on('ready', function() {
        connection.exchange('amp.jingdfh-test.forward.exc', {"type": 'direct'} , function(exchange) {
            _exchange = exchange;
            
            connection.queue('ul.jingdfh-test.wechat.que',function(queue) {
                _queue = queue;
                
                // Bind to the exchange
                queue.bind('amp.jingdfh-test.forward.exc', 'WeChat');
                
                // Subscribe to the queue
                queue
                    .subscribe(function(message) {
                        // Handle message here
                        console.log('Got message', message);
                        //queue.shift(false, false);
                    })
                    .addCallback(function(res) {
                        // Hold on to the consumer tag so we can unsubscribe later
                        _consumerTag = res.consumerTag;
                    })
                ;
            });
        });
    });
} else {
    connection.on('ready', function() {
        connection.exchange('exchange-name', {"type": 'direct'} , function(exchange) {
            _exchange = exchange;
            
            connection.queue('queue-name',function(queue) {
                _queue = queue;
                
                // Bind to the exchange
                queue.bind('exchange-name', 'WeChat');
                
                // Subscribe to the queue
                queue
                    .subscribe(function(message) {
                        // Handle message here
                        console.log('Got message', message);
                        //queue.shift(false, false);
                    })
                    .addCallback(function(res) {
                        // Hold on to the consumer tag so we can unsubscribe later
                        _consumerTag = res.consumerTag;
                    })
                ;
            });
        });
    });
}

// Some time in the future, you'll want to unsubscribe or shutdown
setTimeout(function() {
    if (_queue) {
        _queue
            .unsubscribe(_consumerTag)
            .addCallback(function() {
                // unsubscribed
            })
        ;
    } else {
        // unsubscribed
    }
}, 60000);

function sendAlert (message) {
    _exchange.publish('WeChat', message, {type: 'direct'}, function(err,result){
        if (err) {
            console.log('exchange.publish err : ' + err);
        }
        console.log('exchange.publish : ' + result);
    })
}