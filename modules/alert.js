var amqp = require('amqplib');
/*
var amqp = require('amqplib/callback_api');

amqp.connect('amqp://jingdfh-test:jingdfh-test@localhost:5672/%2Fjingdfh-test', function(err, conn) {
    if (err) {
      throw new Error(err)
    }

    console.log('success:'+conn)
    conn.close()
})
*/

module.exports = {
    sendAlert
}

function sendAlert (msg) {
    amqp.connect('amqp://jingdfh-test:jingdfh-test@localhost:5672/%2Fjingdfh-test').then(function(conn) {
    return conn.createChannel().then(function(ch) {
        var ex = 'amp.jingdfh-test.forward.exc';
        var ok = ch.assertExchange(ex, 'direct', {durable: true})

        var message = {
            "appId": "",
            "mac": msg.macAddr,
            "terGroup": "poc_IIOT",
            "recv": msg.date,
            "description": "固資"+msg.information.epc+"感應",
            "delay":0,
            "notiGroup": [{
                    "group1": [{
                            "andyhe": [{
                                    "method": "WeChat",
                                    "account": "andyhe"
                                }
                            ]
                        },
                        {
                            "LiGuoYigeorge": [{
                                    "method": "WeChat",
                                    "account": "LiGuoYigeorge"
                                    }
                            ]
                        },
                        {
                            "hc": [{
                                    "method": "WeChat",
                                    "account": "hc"
                                    }
                            ]
                        },
                        {
                            "robin_cheng": [{
                                    "method": "WeChat",
                                    "account": "robin_cheng"
                                    }
                            ]
                        }
                    ]
                }
            ],
            "extra": {}
        };

        return ok.then(function() {
        ch.publish(ex, 'WeChat', Buffer.from(JSON.stringify(message)));
        console.log(" [x] Sent '%s'", message);
        return ch.close();
        });
    }).finally(function() { conn.close(); });
    }).catch(console.warn);
}