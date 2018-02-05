var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

let deviceSchema = new Schema({
    macAddr    : {  type: String, required: true},
    data       : {  type: String, required: true},
    recv       : {  type: Date, required: true},
    date       : {  type: String, required: true},
    timestamp  : {  type: Number, required: true},
    extra      : { type: Schema.Types.Mixed, required: true},
    information: { type: Schema.Types.Mixed, required: true},
});
deviceSchema.plugin(mongoosePaginate);

var DeviceModel = mongoose.model('Device', deviceSchema);

module.exports = {
    create,
    findLast,
    find
}

function create (obj,callback) {
    var newDevice = new DeviceModel({
        macAddr     : obj.macAddr,
        data        : obj.data,
        recv        : obj.recv,
        date        : obj.date,
        timestamp   : obj.timestamp,
        extra       : obj.extra,
        information : obj.information
    });
    return new Promise(function (resolve, reject) {
        newDevice.save(function(err, docs){
            if(!err){
                // console.log(now + ' Debug : Device save fail!');
                resolve(docs);
            }else{
                console.log(new Date() + 'Create message fail : ' + err.message);
                reject(err);
            }
        });
    });
}

function findLast (json,callback) {
    return new Promise(function (resolve, reject) {
        DeviceModel.find(json).sort({recv: -1}).limit(1).exec(function(err,result){
            if(err){
                reject(callback(err));
            }else{
                resolve(callback(null, result));
            }
        });
    });
}

function find(json, _paginate, _offset, _limit) {
    return new Promise(function (resolve, reject) {
        if (_paginate === false) {
            DeviceModel.find(json).exec(function(err,result){
                if(err){
                    reject(err)
                }else{
                    resolve(result);
                }
            });
        } else {
            var options = {   
                    // sort: { date: -1 },
                    offset: _offset,
                    limit: _limit
                };
            DeviceModel.paginate(json, options, function(err, result) {
                if(err){
                    reject(err)
                }else{
                    resolve(result);
                }
            });
        }
    });
}


