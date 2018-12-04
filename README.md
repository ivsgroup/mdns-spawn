# MDNS spawn 

[![Version](https://img.shields.io/npm/v/mdns-spawn.svg)](https://www.npmjs.com/package/mdns-spawn)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](http://opensource.org/licenses/MIT)
[![Code style](https://img.shields.io/badge/code%2fstyle-ivs-green.svg)](https://www.npmjs.com/package/eslint-plugin-ivs)


# Installation
```
npm install mdns-spawn
```

# Usage sample
```
const MDNS_Spawn = require('mdns-spawn');

var browser = new MDNS_Spawn();
browser.on('serviceUp', function(service){
  console.log(service);
});

browser.on('serviceDown', function(service){
  console.log("Service down ", service);
});

browser.start();

setTimeout(browser.stop, 4000);

```
