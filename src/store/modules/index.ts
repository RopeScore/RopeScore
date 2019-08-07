const requireModule = require.context('.', false, /\.ts$/)
const modules = {}

requireModule.keys().forEach(fileName => {
  if (fileName === './index.ts') return
  const moduleName = fileName.replace(/(\.\/|\.js|\.ts)/g, '')
  modules[moduleName] = {
    namespaced: true,
    ...(requireModule(fileName).default || requireModule(fileName))
  }
})

export default modules
