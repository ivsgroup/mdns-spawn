'use strict';
var expect = require('expect.js'); // pourquoi il faux que je mette le .js
var cp     = require('child_process');
var once     = require('nyks/function/once');

var	MDNS_Spawn = require('../');


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
			  if(service.service_name == serviceName && service.target.port == servicePort)
			  	chain();  	
			});

			browser.start();

		var foo = cp.spawn("dns-sd", ["-R", serviceName, "_http._tcp", "." , servicePort]);
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

	})

		it("kill with error" , function(){

		var browser = new MDNS_Spawn();
		browser.start();
		browser._proc.kill(0) ;

	})

});




