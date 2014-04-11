
var util = require('util'),
  EventEmitter = require('events').EventEmitter;

var log = require('./index').log;

//  Log = require('./log');

var request = require('superagent')
  , Q = require('q');


var ContentError = function (msg, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg || 'Error';
};
util.inherits(ContentError, Error);
ContentError.prototype.name = 'Content Error';




var Client = module.exports = function (baseUri, auth) {
  if (typeof baseUri !== 'string') {
    throw new Error('Parameter Error "baseUri"');
  }
  this.uri = baseUri;
  this.auth = auth || {uid: '', pwd: ''};
  this.log = log;
};

util.inherits(Client, EventEmitter);


Client.prototype.callWebMethod = function (name, data) {
  var self = this;
  self.log.debug('calling WebMethod ' + name, data);
  if (typeof self.uri === 'undefined') {
    throw new Error('Bad uri');
  }
  return self._post(self.uri + '/' + name, data, self.auth)
    .then(self._checkContent)
    .then(self._jsonify)
    .then(self._jsonOk);
};



Client.prototype._post = function (url, data, auth) {
  var self = this;
  var deferred = Q.defer();
  self.log.debug('posting to ' + url);
  this.log.debug('auth', auth);
  if (typeof url === 'undefined') {
    return deferred.reject(new Error('Parameter Error "url"'));
  }
  else {
    console.log('url', url);
  }
  
  
  request.post(url)
    .auth(self.auth.uid, self.auth.pwd)
    .send(data)
    .set('Accept', 'application/json')
    //.set("Content-Type", 'application/json')
    .on('error', handle)
    .end(function (res) {
      if (res.status === 500) {
        self.log.error('superagent did not catch the 500 error', res.error, data, res.text);
        handle(res.error);
      }
      deferred.resolve(res);
    });

  function handle(err) {
    self.log.error('posting error', {err: err});
    return deferred.reject(new Error('Request error', err));
  }

  return deferred.promise;
};


Client.prototype._checkContent = function (res, contentType) {
  contentType = contentType || 'application/json';
  return Q.fcall(function () {
    if (res.type !== contentType) {
      throw new ContentError(util.format('%s Data:%s', res.type, res.text));
    }
    return res;
  });
};


Client.prototype._jsonOk = function (json) {
  return Q.fcall(function () {
    if (!json.hasOwnProperty('status')) {
      throw new Error('status property is missing');
    }
    if (json.status !== 200) {
      throw new Error(util.format('Bad Result Status:%j', json));
    }
    if (!json.hasOwnProperty('message')) {
      throw new Error('message property is missing');
    }
    return json.message;
  });
};

Client.prototype._jsonify = function (res) {
  var self = this;
  var deferred = Q.defer();
  result = {status: res.status};

  var j = {};
  try {
    j =  JSON.parse(res.text);
    delete j.__type;
    if (result.status !== 200) {
      result.error = j;
    }
    else {
      result.message = j.d;
    }
    process.nextTick(function () {
      deferred.resolve(result);
    });
  }
  catch (err) {
    self.log.error(util.format('error in %s, data=%s', res.req.path, res.text), {err: err});
    process.nextTick(function () {
      deferred.reject(err);
    });
  }


  return deferred.promise;
};