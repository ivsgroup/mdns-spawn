# MDNS spawn 



# Usage sample
```
var MDNS_Spawn = require('./mdns_spawn.js').MDNS_Spawn;

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