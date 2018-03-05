var moment = require('moment-timezone');
var mongoDevice = require('./mongoDevice.js');
var mongoMap = require('./mongoMap.js');
var config = require('../config');
var debug = true;
var CryptoJS = require("crypto-js");
var async  = require('async');
var config = require('../config');
var mysqlTool = require('./mysqlTool.js');
var debug = isDebug();
var epc = require('node-epc');

module.exports = {
    checkDevice,
    parseMsgd,
    createMap,
    checkAndParseToken,
    checkAndParseMessage,
    checkFormData,
    isDebug,
    isAuth,
    getCurrentTime,
    getMsgJson,
    getDataJson
}

function isAuth () {
    return config.auth;
}

function isDebug () {
    return config.debug;
}
  
function checkDevice(mac, callback) {
    var datas = db.getDevices(mac, function(err, devices){
        if (err) {
          // console.log('getDevices fail : ' + err);
          return callback(err);
        }
        // console.log('getDevices success : \n' + JSON.stringify(devices));
        return (null,devices);
    })
}

function parseMsgd(obj, callback) {

    if (getType(obj) === 'other') {
        return callback('Not JSON');
    }
    var fport = obj.fport.toString();
    //Get data attributes
    var mData = obj.data;
    mMac  = obj.macAddr;
    var timestamp = convertTime(obj.time);
    var tMoment = (moment.unix(timestamp/1000)).tz(config.timezone);
    var mRecv = obj.time;
    var mDate = tMoment.format('YYYY-MM-DD HH:mm:ss');

    // console.log('mRecv : '+  mRecv);
    // console.log('mDate : '+ mDate);
    var mExtra = {'gwip': obj.gwip,
              'gwid': obj.gwid,
              'rssi': obj.rssi,
              'snr' : obj.snr,
              'fport': obj.fport,
              'frameCnt': obj.frameCnt,
              'channel': obj.channel};

    //Parse data
    if(mExtra.fport){
        var mType = mExtra.fport.toString();
        mongoMap.findLast({'deviceType': fport}).then(function(doc) {
            // console.log('docs : ' + typeof doc);
            if(doc) {
                var mInfo = getTypeData(mData,doc);
                if (debug) {
                    console.log(getCurrentTime() + ' Information : ' + JSON.stringify(mInfo));
                }
                if (mExtra.fport === 160) {
                    
                    if (mInfo.header === 170 && mInfo.end === 142) {
                       delete mInfo.header;
                       delete mInfo.end; 
                    } else {
                        mInfo = null;
                    }
                }
                
                if(mInfo){
                    var msg = {macAddr: mMac, data: mData, timestamp: timestamp, recv: mRecv, date: mDate, extra: mExtra};
                    // console.log('**** '+msg.date +' mac:'+msg.macAddr+' => data:'+msg.data+'\ninfo:'+JSON.stringify(mInfo));
                    msg.information=mInfo;
                    
                    if (debug) {
                        console.log(getCurrentTime() + ' parseMsgd message finished');
                    }
                    return callback(null, msg);
                } else {
                    if (debug) {
                        console.log(getCurrentTime() + ' parseMsgd info is not exist');
                    }
                    return callback({"error": "Information is not exist"});
                }
            } else {
                if (debug) {
                    console.log(getCurrentTime() + ' No map for type '+ fport);
                }
                return callback({"error" : "No map of type " + fport});
            }
            
        }, function(reason) {
            if (debug) {
                console.log(getCurrentTime() + ' parseMsgd findLast err : ' + reason);
            }
            return callback({"error": reason});
        });
    } else {
        if (debug) {
            console.log(getCurrentTime() + ' parseMsgd fport is not exist');
        }
        return callback({"error": "fport is not exist"});
    }
}

function createMap () {
    var myobj = {
        type        : '17',
        typeName    : '土壤溫濕酸鹼電導感測',
        fieldName   :  {
                            "temperature": "溫度",
                            "ph": "酸鹼度",
                            "water": "水含量",
                            "ec": "電導度"
                        },
        map         :   { 
                            "ph": [4, 8, 11],
                            "water": [14, 18, 100],
                            "temperature": [ 18, 22, 100],
                            "ec": [22, 26, 1000]
                        },
        createUser  : 'Jason'
    };
    mongoMap.create(myobj).then(function(docs) {
        console.log('docs : ' + JSON.stringify(docs));
    }, function(reason) {
        console.log('err : ' + reason);
    });
}

function getTypeData(data,mapObj) {
    if (mapObj === undefined|| mapObj === null) {
        return null;
    }
    try {
        var obj = mapObj.map;
        var info = {};
        var keys = Object.keys(obj);
        var count = keys.length;
        for(var i =0;i<count;i++){
            //console.log( keys[i]+' : '+ obj[keys[i]]);
            info[keys[i]] = getIntData(obj[keys[i]],data);
            // console.log(keys[i] + ' : ' + info[keys[i]]);
        }
        return info;
    } catch (error) {
        return null;
    }
}

function getIntData(arrRange,initData){
    var ret = {};
    var start = arrRange[0];
    var end = arrRange[1];
    var subStr = initData.substring(start,end);
    var diff = arrRange[2];
    if (diff === 'epc') {
        /*parseEPC(subStr, null, function(err, parsed){
            if (err) {
                return null;
            }
            return parsed;
        })*/
        return subStr;
    } else if (diff==='signhex') {
       return parseSignHex(subStr);
    } else {
        var data = parseInt(subStr, 16);
        // example : 
        // diff = "data/100"
        // data = 2000
        // eval(diff) = 2000/100 = 20
        var result = eval(diff)
        return Number(result.toFixed(2));
    }
}

function convertTime(dateStr) {
    //method 1 - use convert function
    //var d = new Date();
    var d = new Date(dateStr);
    var d_ts = d.getTime(); //Date.parse('2017-09-12 00:00:00'); //get time stamp
    // console.log("showSize :"+ d);
    // console.log("showPos d_ts : " + d_ts);
    return d_ts;
}

function getType(p) {
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}

function saveMsgToDB (msg) {
    mongoDevice.create(msg).then(function(docs) {
        console.log('saveMsgToDB ok');
    }, function(reason) {
        console.log('saveMsgToDB err : ' + reason);
    });
}

function checkAndParseToken (token,callback) {
	if (!token) {
        if (debug) {
            console.log('Token is missing');
        }
		return({
			"responseCode" : '999',
			"responseMsg" : 'Missing parameter'
		});
	} else if (token.length < 1){
        if (debug) {
            console.log('Token length error');
        }
		return({
			"responseCode" : '999',
			"responseMsg" : 'Token length error'
		});
	}
		
	// Decrypt 
	console.log('token :\n' + token);
	try {
		var encrypted  = CryptoJS.TripleDES.decrypt(token, config.secretKey);
		var encryptedBase64 = encrypted.toString(CryptoJS.enc.Utf8);
        
        if (debug) {
            console.log('Token encrypte :' + encryptedBase64);
        }
		var tArr = encryptedBase64.split(':')
		var ts = tArr[1];
	} catch (error) {
		console.log(error);
	}
    
    //fun2 getProperties 不需要 fun1 getHistory 的資料
    //但最後的結果要把 fun1 fun2 的資料整合起來
	async.series([
		function(next){
			mysqlTool.getHistory(token, function(err1, result1){
                next(err1, result1);
			});
		},
		function(next){
			mysqlTool.getProperties(function(err2, result2){
                next(err2, result2);
			});
		}
	], function(errs, results){
		if(errs) {
            if (debug) {
                console.log('checkAndParseToken err :\n' + JSON.parse(errs));
            }
            return callback({
                "responseCode" : '404',
                "responseMsg" : 'Query data fail'
            });
        }
        //Get history check
        if(results[0] === undefined || results[0].length <1){
            if (debug) {
                console.log('User already logout');
            }
            return callback({
                "responseCode" : '404',
                "responseMsg" : 'User already logout'
            });
        }
        //Get properties check
        if (results[1].length < 1) {
            if (debug) {
                console.log('No properties data');
            }
            return callback({
                "responseCode" : '404',
                "responseMsg" : 'No properties data'
            });
        }
        try {
            var period = Number(results[1].p_value);
            var d = new Date()
            var nowSeconds = Math.round(d.getTime() / 1000)
            var loginSeconds = parseInt(ts)
            let subVal = nowSeconds - loginSeconds;
            if( subVal > period || subVal < 0 ){
                if (debug) {
                    console.log('Token expired');
                }
                return callback({
                    "responseCode" : '401',
                    "responseMsg" : 'Token expired'
                });
            }else{
                return callback(null,tArr);
            }
        } catch (error) {
            onsole.log(getCurrentTime() + ' checkAndParseToken err :' + error);
            return callback({
                "responseCode" : '999',
                "responseMsg" : error
            });
        }
	});
}

function getMsgJson (message) {
    if (getType(message) === 'string') {
        try {
            var mesObj = JSON.parse(message);
        } catch (error) {
            return callback(error.message);
        }
        
        if (getType(mesObj) === 'other') {
            return callback('Not JSON');
        }
        var obj = mesObj[0];
    } else if (getType(message) === 'object'){
        var obj = message;
    }
    return obj;
}

function getDataJson(msg, checkData) {
    try {
        var obj = getMsgJson(msg);
        // Check data by data json in memory
        console.log(getCurrentTime() + ' mac: '+obj.macAddr + ' , frameCnt: ' + obj.frameCnt );
        var checkObj = checkData[obj.macAddr];
        if (checkObj === undefined) {
            return obj;
        } else if (obj.frameCnt !== checkObj.frameCnt) {
            return obj;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

function checkAndParseMessage (message, callback) {
    var obj = getMsgJson(message);
    var json = {"macAddr": obj.macAddr, "extra.frameCnt": obj.frameCnt};
    //fun2 getProperties 不需要 fun1 getHistory 的資料
    //但最後的結果要把 fun1 fun2 的資料整合起來
	async.series([
		function(next){
			mongoDevice.findLast(json, function(err1, result1){
                next(err1, result1);
			});
		},
		function(next){
			parseMsgd(obj, function(err2, result2){
                next(err2, result2);
			});
		}
	], function(errs, results){
        if(errs){
            console.log(getCurrentTime() + ' checkAndParseMessage err : ' + JSON.stringify(errs));
            return callback(errs);
        } 
        
        if (results[0].length === 0) {
            //If no same data
            if(results && results.length >1) {
                console.log(getCurrentTime() + ' No same data, return publish message :\n' + JSON.stringify(results[1]));
                //Save message to mongo database
                saveMsgToDB(results[1]);
                return callback(null, results[1]);
            } else {
                return callback(null, null);
            }    
        } else if (results[0].length === 1){
            //If has same data then check timestamp
            var ts1 = results[0][0].timestamp;
            var ts2 = results[1].timestamp;
            // If over ond day to forward data
            if (Math.abs(ts1 -ts2) > 86400) {
                console.log('Has same data (mac,frameCnt) but timestamp is different return publish message');
                //Save message to mongo database
                saveMsgToDB(results[1]);
                return callback(null, results[1]);
            } else {
                console.log('Has same data to drop message');
                return callback({
                    "responseCode" : '401',
                    "responseMsg" : 'Has same data'
                });
            }
        }
    });
}

function checkFormData (req, checkArr) {
    try {
        var keys = '';
        var values = '';
        var keys = Object.keys(req.body);
        /* if (keys.length < checkArr.length) {
            return null;
        } */
        var count = 0;
        var json = {};
        keys.forEach(function(key,index) {
            console.log('index : ' + index + ', key : ' + key );
            if(checkArr.indexOf(key) !== -1) {
                if(key === 'map' || key === 'fieldName') {
                    json[key] = JSON.parse(req.body[key]);
                } else {
                    json[key] = req.body[key];
                }
                
                count ++;
            }
        });
        //Not include token key
        if (count !== (checkArr.length)) {
            return null;
        } else {
            delete json.token;
            return json;
        }
    } catch (error) {
        return 'Parameter format error';
    }
}

function getCurrentTime() {
    var now = moment();
    return now.tz(config.timezone).format('YYYY/MM/DD HH:mm:ss');
}

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function parseEPC(code, specified, callback) {
    if (specified) {
        epc.getParser(specified)
        .then(function(sgtin) {
            sgtin.parse(code)
                .then(function(parsed) {
                    console.log('Encoding = ' + parsed.getName());
                    console.log('Company Prefix = ' + parsed.parts.CompanyPrefix);
                    console.log('Item Reference = ' + parsed.parts.ItemReference);
                    console.log('Serial Number = ' + parsed.parts.SerialNumber);
                    console.log('parsed = ' + JSON.stringify(parsed.parts));
                    callback(null,parsed.parts);
                })
                .fail(function(err) {
                    console.error(err);
                    callback(err);
                });
        });
    } else {
        epc.parse(code)
        .then(function(parsed) {
            console.log('Encoding = ' + parsed.getName());
            console.log('Company Prefix = ' + parsed.parts.CompanyPrefix);
            console.log('Item Reference = ' + parsed.parts.ItemReference);
            console.log('Serial Number = ' + parsed.parts.SerialNumber);
            console.log('parsed = ' + JSON.stringify(parsed.parts));
            callback(null,parsed.parts);
        })
        .fail(function(err) {
            console.error(err);
            callback(err);
        });
    }
}

function parseSignHex(hex) {
    if (hex.length % 2 != 0) {
        hex = "0" + hex;
    }
    var num = parseInt(hex, 16);
    var maxVal = Math.pow(2, hex.length / 2 * 8);
    if (num > maxVal / 2 - 1) {
        num = num - maxVal
    }
    return num;
}