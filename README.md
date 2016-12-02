# MDNS spawn 

[![Version](https://img.shields.io/npm/v/mdns-spawn.svg)](https://www.npmjs.com/package/mdns-spawn)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](http://opensource.org/licenses/MIT)


# Installation
```
npm install mdns-spawn
```

# Usage sample
```
var MDNS_Spawn = require('mdns-spawn');

var browser = new MDNS_Spawn();
browser.addEvent('serviceUp', function(service){
  console.log(service);
});

browser.addEvent('serviceDown', function(service){
  console.log("Service down ", service);
});

browser.start();

setTimeout(browser.stop, 4000);

```