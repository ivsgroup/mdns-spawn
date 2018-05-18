'use strict';

const cp      = require('child_process');
const Events  = require('events');

const queue  = require('async/queue');

const endsWith = require('mout/string/endsWith');
const once     = require('nyks/function/once');
const stripEnd = require('nyks/string/stripEnd');

RegExp.escape = function(str) { // from stack
  str = str.replace(/ /g, "\\032");
  /*eslint no-useless-escape: 0*/
  str = str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  return str;
};


var DNS_SD = "dns-sd.exe";

const throttle = function(generator, workers) {
  var q = queue(generator, workers);
  return q.push.bind(q);
};

const resolve_hostname = function(host_name, callback) {
  /* istanbul ignore next */
  if(!endsWith(stripEnd(host_name, "."), ".local"))
    return callback(null, host_name);

  callback = once(callback);
  var reg = [RegExp.escape(host_name), "\\.?\\s+", "([0-9.]+)"];
  var lookup = cp.spawn(DNS_SD, ["-G ", "v4", host_name]);

  var splitter = new RegExp(reg.join(''));
  setTimeout(function() {
    lookup.kill();
    callback("Lookup hostname timeout");
  }, 1000 * 2);

  //lookup.on('error', Function.prototype);
  lookup.stdout.on("data", function(data) {
    /* istanbul ignore if */
    if(!splitter.test(data))
      return;
    lookup.kill();
    var res = splitter.exec(data);
    callback(null, res[1]);
  });
};

const resolve_hostnameq = throttle(resolve_hostname, 5);


const resolve_service = function(task, callback) {
  var service_name = task.service_name;
  var service_type = task.service_type;
  var domain       = task.domain;

  callback = once(callback);

  var reg = [RegExp.escape(service_name), "\\.", RegExp.escape(service_type), RegExp.escape(domain), "\\s+", "can be reached at\\s+(.*?):([0-9]+)"];
  var lookup = cp.spawn(DNS_SD, ["-L ", service_name, service_type, domain]);

  var splitter = new RegExp(reg.join(''));

  setTimeout(function() {
    lookup.kill();
    callback("Resolve servicetimeout");
  }, 1000 * 2);

  //lookup.on('error', this.spawnErrorHandler.bind(this));
  lookup.stdout.on("data", function(data) {
    /* istanbul ignore if */
    if(!splitter.test(data))
      return;
    lookup.kill();
    var res = splitter.exec(data);

    resolve_hostnameq(res[1], function(err, host_addr) {

      /* istanbul ignore if  */
      if(err)
        return callback(err);
      callback(null, {host : host_addr, hostname : res[1], port : Number(res[2])});
    });
  });
};


const resolve_serviceq = throttle(resolve_service, 5);



class MDNS_Spawn extends Events.EventEmitter {

  constructor(service_type, domain) {
    super();
    this._proc         = null;
    this._service_type = null;
    this._domain       = null;
    this._service_type = service_type ||  "_http._tcp.";
    this._domain = domain ||  "local.";
    this.resolve_hostname = resolve_hostnameq;
  }

  spawnErrorHandler(err) /* istanbul ignore next */ {
    this.emit(MDNS_Spawn.EVENT_DNSSD_ERROR, err);
  }

  stop() {
    if(!this._proc)
      return;

    this._proc.kill();
    this._proc = null;
  }

  start() {
    var self = this;
    var reg = ["^.*", "(Add|Rmv).*", RegExp.escape(this._domain), "\\s+", RegExp.escape(this._service_type), "\\s+", "(.*)"];
    if(this._proc)
      return; //already running !

    this._proc = cp.spawn(DNS_SD, ["-B", this._service_type, this._domain]);

    var splitter = new RegExp(reg.join(''));
    var buffer = "";

    this._proc.on('error', this.spawnErrorHandler.bind(this));
    this._proc.stdout.on("data", function(data) {
      buffer += data;

      var i = buffer.lastIndexOf("\n");
      var tmp = buffer.substr(0, i);
      buffer = buffer.substr(i + 1);
      var blocs = tmp.split("\n");

      blocs.forEach(function(block) {
        if(!splitter.test(block))
          return;
        var res = splitter.exec(block);
        var operation    = res[1];
        var service_name = res[2];

        var service =  {service_name};
        if(operation == "Add") {
          resolve_serviceq({service_name, service_type : self._service_type, domain : self._domain }, function(err, result) {
            /* istanbul ignore else */
            if(!err)
              service.target  = result;
            self.emit(MDNS_Spawn.EVENT_SERVICE_UP, service);
          });
        }

        if(operation == "Rmv")
          self.emit(MDNS_Spawn.EVENT_SERVICE_DOWN, service);

      });
    });
  }
}

MDNS_Spawn.EVENT_DNSSD_ERROR  = 'dnssdError';
MDNS_Spawn.EVENT_SERVICE_UP   = 'serviceUp';
MDNS_Spawn.EVENT_SERVICE_DOWN = 'serviceDown';

module.exports = MDNS_Spawn;
