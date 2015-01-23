# MDNS spawn 

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