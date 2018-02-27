"use strict";

const cp      = require('child_process');
const gateway = require('default-gateway');
const os      = require('os');

const filter = require('mout/array/filter');
const map    = require('mout/array/map');
const pick   = require('mout/array/pick');
const defer  = require('nyks/promise/defer');

var child = null;

var register = async (serviceName, servicePort, hostName) => {
  let interfaces = os.networkInterfaces();

  let default_gateway = await gateway.v4();
  let interface_name  = default_gateway.interface;

  if (!interfaces[interface_name])
    throw `No interface ${interface_name} found.`;

  var ipv4 = map(filter(interfaces[interface_name], (address) => address.family == 'IPv4' && address.address !== '127.0.0.1'), (addr) => addr.address);

  ipv4 = (ipv4.length > 1) ? pick(ipv4) : ipv4[0];

  let defered = defer();

  // kill previous one if it exists
  register.kill();

  child = cp.spawn("dns-sd", ["-P", serviceName, "_http._tcp", ".", servicePort, hostName, ipv4]);

  child.stdout.on('data', buf => {
    console.log(serviceName, "has been registered on", ipv4);
    defered.resolve();
  });

  child.on('error', defered.reject);

  return defered;
};


register.kill = () => {
  if (child)
    child.kill();
  child = null;
};

module.exports = register;
