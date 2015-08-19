var cp = require("child_process");
var endsWith = require("mout/string/endsWith");
var stripEnd = require("nyks/string/stripEnd");

var Class = require("uclass"),
    Events = require('uclass/events');

RegExp.escape = function(str){ // from stack
  str = str.replace(/ /g, "\\032");
  str = str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  return str;
}




var MDNS_Spawn = module.exports = new Class({
  Implements : [Events],
  Binds : ['stop', 'start'],

  _proc : null,
  _service_type : null,
  _domain : null,
  initialize:function(service_type, domain){
    this._service_type = service_type ||  "_http._tcp.";
    this._domain = domain ||  "local.";
  },

  spawnErrorHandler: function(err){
    this.fireEvent(MDNS_Spawn.EVENT_DNSSD_ERROR, err);
  },

  stop : function(){

    if(!this._proc)
      return;

    this._proc.kill();
    this._proc = null;
  },


  _resolve_service :  function(service_name, service_type, domain, callback ) {
    //console.log("Resolving '%s' type '%s' under '%s'", service_name, service_type, domain);

    var self = this,
        reg = [ RegExp.escape(service_name), "\\.", RegExp.escape(service_type), RegExp.escape(domain), "\\s+", "can be reached at\\s+(.*?):([0-9]+)" ],
        lookup = cp.spawn("dns-sd", ["-L ", service_name, service_type, domain]);

    var splitter = new RegExp(reg.join(''));

    setTimeout(lookup.kill.bind(lookup), 1000 * 2);

    lookup.on('error', this.spawnErrorHandler.bind(this));
    lookup.stdout.on("data", function(data){
      if(!splitter.test(data))
        return;
      lookup.kill();
      var res = splitter.exec(data);

      self._resolve_hostname(res[1], function(err, host_addr){
        callback(null, {host:host_addr,hostname: res[1], port:Number(res[2])});
      });
    });
  },

 _resolve_hostname : function(host_name, callback){
    if(! endsWith(stripEnd(host_name, "."), ".local"))
      return callback(null, host_name);

    var self = this,
        reg = [ RegExp.escape(host_name), "\\.?\\s+", "([0-9.]+)" ],
        lookup = cp.spawn("dns-sd", ["-G ", "v4", host_name]);

    var splitter = new RegExp(reg.join(''));
    setTimeout(lookup.kill.bind(lookup), 1000 * 2);

    lookup.on('error', this.spawnErrorHandler.bind(this));
    lookup.stdout.on("data", function(data){
      if(!splitter.test(data))
        return;
      lookup.kill();
      var res = splitter.exec(data);
      callback(null, res[1]);
    });
 },


  start : function(){
    var self = this,
        reg = ["^.*", "(Add|Rmv).*",  RegExp.escape(this._domain), "\\s+", 
              RegExp.escape(this._service_type), "\\s+",
              "(.*)"];
    if(this._proc)
      return; //already running !

    this._proc = cp.spawn("dns-sd", ["-B", this._service_type, this._domain]);

    var splitter = new RegExp(reg.join('')); 
    var buffer = "";

    this._proc.on('error', this.spawnErrorHandler.bind(this));
    this._proc.stdout.on("data", function(data){
      buffer += data;

      var i = buffer.lastIndexOf("\n");
      var tmp = buffer.substr(0, i);
      buffer = buffer.substr(i+1);
      var blocs = tmp.split("\n");

      blocs.forEach(function(block){
        if(!splitter.test(block))
          return;
        var res = splitter.exec(block);
        var operation = res[1], service_name = res[2];

        var service =  {service_name: service_name};
        if(operation == "Add")
          self._resolve_service(service_name, self._service_type, self._domain, function(err, result){
            service.target  = result;
            self.fireEvent(MDNS_Spawn.EVENT_SERVICE_UP, service);
          });

        if(operation == "Rmv")
          self.fireEvent(MDNS_Spawn.EVENT_SERVICE_DOWN,service);

      });

    });

  },

});

MDNS_Spawn.EVENT_DNSSD_ERROR = 'dnssdError';
MDNS_Spawn.EVENT_SERVICE_UP = 'serviceUp';
MDNS_Spawn.EVENT_SERVICE_DOWN = 'serviceDown';

