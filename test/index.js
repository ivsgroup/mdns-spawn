'use strict';
/* eslint-env node, mocha */

const expect = require('expect.js');

const now    = require('mout/time/now');
const once   = require('nyks/function/once');
const defer  = require('nyks/promise/defer');

const MDNS_Spawn       = require('../');
const register_service = require('../register').service;

describe("Initial test suite for mdns-spawn", function() {

  this.timeout(4000);
  var serviceName = "dummy local service " + now();
  var servicePort = 14545;
  var service_o   = null;

  it("should detect a dummy registration and stop", async  function() {

    var defered = defer();

    var browser = new MDNS_Spawn();
    var chain   = once(function() {
      browser.on('serviceDown', function(service) {
        if(service.service_name == serviceName)
          defered.resolve();
      });
      service_o.kill();
      //cover multiple try to kill
      service_o.kill();
    });

    browser.on('serviceUp', function(service) {
      console.log({service});
      if(service.service_name == serviceName && service.target.port == servicePort)
        chain();
    });

    browser.start();

    service_o = await register_service(serviceName, servicePort);
    await defered;
  });

  it("multiple start and stopsupport", function() {

    var browser = new MDNS_Spawn();
    browser.start();
    var pid = browser._proc.pid ;
    browser.start();
    expect(browser._proc.pid).to.be(pid);
    browser.stop();
    browser.stop();
    expect(browser._proc).not.to.be.ok();

  });

});
