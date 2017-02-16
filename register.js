"use strict";

const cp = require('child_process');

module.exports = (serviceName, servicePort) => {
    return cp.spawn("dns-sd", ["-R", serviceName, "_http._tcp", "." , servicePort]);
}