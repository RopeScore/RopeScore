/* eslint-disable @typescript-eslint/no-require-imports */

require('ts-node').register({
  project: './tsconfig.electron.json'
})
require('./background.ts')
