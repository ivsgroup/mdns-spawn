"use strict";

const cp      = require('child_process');
const gateway = require('default-gateway');
const os      = require('os');

const filter = require('mout/array/filter');
const map    = require('mout/array/map');
const pick   = require('mout/array/pick');
const defer  = require('nyks/promise/defer');

var child_host = null;
var child_serv = null;

var kill_host = () => {
  if (child_host)
    child_host.kill();
  child_host = null;
};

var kill_service = () => {
  if (child_serv)
    child_serv.kill();
  child_serv = null;
};

const service = async (serviceName, servicePort) => {
  let defered = defer();

  // kill previous one if it exists
  kill_service();

  child_serv = cp.spawn("dns-sd", ["-R", serviceName, "_http._tcp", ".", servicePort]);

  child_serv.stdout.on('data', () => {
    console.log(serviceName, "has been registered");
    defered.resolve();
  });

  child_serv.on('error', defered.reject);

  await defered;

  return {kill : kill_service};
};

const host = async (serviceName, servicePort, hostName) => {
  let interfaces = os.networkInterfaces();

  let default_gateway = await gateway.v4();
  let interface_name  = default_gateway.interface;

  if (!interfaces[interface_name])
    throw `No interface ${interface_name} found.`;

  var ipv4 = map(filter(interfaces[interface_name], (address) => address.family == 'IPv4' && address.address !== '127.0.0.1'), (addr) => addr.address);

  ipv4 = (ipv4.length > 1) ? pick(ipv4) : ipv4[0];

  let defered = defer();

  // kill previous one if it exists
  kill_host();

  child_host = cp.spawn("dns-sd", ["-P", serviceName, "_http._tcp", ".", servicePort, hostName, ipv4]);

  child_host.stdout.on('data', () => {
    console.log(serviceName, "has been registered on", ipv4);
    defered.resolve();
  });

  child_host.on('error', defered.reject);

  await defered;

  return {kill : kill_host};
};

module.exports = {host, service};
