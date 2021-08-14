require('ts-node').register({
  project: './tsconfig.electron.json'
});
require('./background.ts')
