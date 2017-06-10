const winstaller = require('electron-winstaller');
const packager = require('electron-packager');
const path = require('path');
const assert = require('assert');
const fs = require('fs-extra')
const argv = require('yargs')
  .usage('Usage: node $0 [options]')
  .wrap(require('yargs')
    .terminalWidth())
  .default('arch', process.arch)
  .describe('arch', 'arch to build for')
  .choices('arch', ['x64', 'ia32', 'armv7l'])
  .help('help')
  .alias('h', 'help')
  .argv

const package = require('./package.json')
const Config = require('./app/config.js')

const repositoryRootPath = path.resolve(__dirname)
const buildOutputPath = path.join(repositoryRootPath, 'build')
const distOutputPath = path.join(repositoryRootPath, 'dist')
const packagedAppPath = path.join(repositoryRootPath, 'app')

const packageOptions = {
  'appBundleId': 'pw.swant.ropescore',
  'appCopyright': `Copyright © ${((new Date()).getFullYear() == 2017 ? '2017' : '2017-' + ((new Date()).getFullYear()) )} Svante Bengtson.`,
  'appVersion': package.version,
  'arch': process.platform === 'darwin' ? 'x64' : argv.arch, // OS X is 64-bit only
  'asar': true,
  'buildVersion': package.version,
  'dir': path.join(repositoryRootPath),
  'icon': getIcon(),
  'ignore': ['dist'],
  'name': package.name,
  'out': buildOutputPath,
  'overwrite': true,
  'platform': process.platform,
  'version-string': {
    'CompanyName': package.name,
    'FileDescription': package.name,
    'ProductName': package.name
  }
}


const installerOptions = {
  appDirectory: path.join(buildOutputPath,
    `${package.name}-${process.platform}-${argv.arch}-${package.version}`),
  iconUrl: getIcon(),
  loadingGif: path.join(repositoryRootPath, 'app', 'static', 'img', 'gif',
    'installing.gif'),
  outputDirectory: path.join(distOutputPath, process.platform, argv.arch),
  noMsi: true,
  setupExe: `${package.name}-${process.platform}-${argv.arch}-${package.version}-Setup.exe`,
  //remoteReleases: Config.releaseRemoteUrl(argv.arch),
  setupIcon: path.join(repositoryRootPath, 'app', 'static', 'img', 'icon.ico'),
  version: require('./package.json')
    .version
}

function getIcon() {
  switch (process.platform) {
    case 'darwin':
      return path.join(repositoryRootPath, 'app', 'static', 'img', 'icon.icns')
      /*case 'linux':
        // Don't pass an icon, as the dock/window list icon is set via the icon
        // option in the BrowserWindow constructor in atom-window.coffee.
        return null*/
    default:
      return path.join(repositoryRootPath, 'app', 'static', 'img', 'icon.ico')
  }
}

function runPackager(options) {
  return new Promise((resolve, reject) => {
    packager(packageOptions, (err, packageOutputDirPaths) => {
      if (err) {
        reject(err)
        throw new Error(err)
      } else {
        assert(packageOutputDirPaths.length === 1,
          'Generated more than one electron application!')
        const packagedAppPath = renamePackagedAppDir(
          packageOutputDirPaths[0])
        resolve(packagedAppPath)
      }
    })
  })
}

function renamePackagedAppDir(packageOutputDirPath) {
  let packagedAppPath
  if (process.platform === 'darwin') {
    const appBundleName = package.name + '.app'
    packagedAppPath = path.join(buildOutputPath, appBundleName)
    if (fs.existsSync(packagedAppPath)) fs.removeSync(packagedAppPath)
    fs.renameSync(path.join(packageOutputDirPath, appBundleName),
      packagedAppPath)
  } else {
    packagedAppPath = path.join(buildOutputPath,
      `${package.name}-${process.platform}-${argv.arch}-${package.version}`
    )
    if (fs.existsSync(packagedAppPath)) fs.removeSync(packagedAppPath)
    fs.renameSync(packageOutputDirPath, packagedAppPath)
  }
  return packagedAppPath
}

console.log(`Building ${package.name} version ${package.version}`)
runPackager(packageOptions)
  .then((packagedAppPath) => {
    console.log('app packaged')
    installerOptions.appDirectory = packagedAppPath;
    winstaller.createWindowsInstaller(installerOptions)
  })

return
