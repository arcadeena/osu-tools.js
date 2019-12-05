# osu-tools.js
A JavaScript wrapper for osu-tools

```js
const osuTools = require('osu-tools.js');

osuTools.setPath('./osu-tools'); // Path to precompiled osu-tools dll files
osuTools.difficulty('./12345.osu', [osuTools.MOD, 'hd']).then(console.log).catch(console.log);
osuTools.performance('./12345.osu', ['-r', './b.osr', '-r', './c.osr']).then(console.log).catch(console.log);
osuTools.simulate('./12345.osu', [osuTools.ACC, '99', '-m', 'hr']).then(console.log).catch(console.log);
osuTools.profile('API_KEY', 'Arcadeena').then(console.log).catch(console.log);
```
