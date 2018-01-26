'use strict';


const expect = require('expect.js');
const cp     = require('child_process');
const once     = require('nyks/function/once');

const MDNS_Spawn = require('../');
const DNS_SD = "dns-sd.exe";


describe("Initial test suite for mdns-spawn", function(){

  this.timeout(4000);
  var serviceName = "dummy local service", servicePort = 14545;


  it("should detect a dummy registration and stop", function(done){
    done = once(done)
    var browser = new MDNS_Spawn();
    
    var chain = once(function(){
        browser.on('serviceDown', function(service){
           if(service.service_name == serviceName)
              done() ;
        });

        foo.kill();
      });

      browser.on('serviceUp', function(service){
        console.log({service});
        if(service.service_name == serviceName && service.target.port == servicePort)
          chain();
      });

      browser.start();

    var foo = cp.spawn(DNS_SD, ["-R", serviceName, "_http._tcp", "." , servicePort]);
  })

  it("multiple start and stopsupport" , function(){

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




