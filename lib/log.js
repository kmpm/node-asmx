var util = require('util');

var active = {
  'DEBUG': true,
  'INFO':true,
  'WARN':true,
  'ERROR':true
};


var LEVELS = ['debug', 'info', 'warn', 'error'];


function log(levelname) {
  levelname = levelname.toUpperCase();
  return function() {
    if(!active[levelname]) {
      return;
    }
    var msg = format(arguments);
    this.emitter.emit('log', levelname, msg);
  };
}


function format(obj) {
  var objects = [];
  for(var i=0; i<obj.length; i++){
    objects.push(obj[i]);
  }
  return util.format.apply(util, objects);
}


var Log = function(emitter){
  this.emitter = emitter;
};


LEVELS.forEach(function(l){
  Log.prototype[l] = log(l);
});



module.exports = Log;