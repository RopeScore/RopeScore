const winstaller = require('electron-winstaller');
const packager = require('electron-packager');
const path = require('path');
const assert = require('assert');
const fs = require('fs-extra')
const argv = require('yargs')
  .usage('Usage: node $0 [options]')
  .wrap(require('yargs')
    .terminalWidth())
  .alias('a', 'arch')
  .default('a', process.arch)
  .describe('a', 'arch to build for')
  .choices('a', ['x64', 'ia32', 'armv7l'])
  .alias('p', 'platform')
  .default('p', process.platform)
  .describe('p', 'platform to build for')
  .choices('p', ['win32', 'darwin', 'linux'])
  .help('help')
  .alias('h', 'help')
  .argv

const Package = require('./package.json')
const Config = require('./app/config.js')

const repositoryRootPath = path.resolve(__dirname)
const buildOutputPath = path.join(repositoryRootPath, 'build')
const distOutputPath = path.join(repositoryRootPath, 'dist')
const packagedAppPath = path.join(repositoryRootPath, 'app')
const baseName =
  `${Package.name}-${argv.platform}-${argv.arch}-${Package.version}`

const packageOptions = {
  'appBundleId': 'pw.swant.ropescore',
  'appCopyright': `Copyright © ${((new Date()).getFullYear() == 2017 ? '2017' : '2017-' + ((new Date()).getFullYear()) )} Svante Bengtson.`,
  'appVersion': Package.version,
  'arch': argv.platform === 'darwin' ? 'x64' : argv.arch, // OS X is 64-bit only
  'asar': true,
  'buildVersion': Package.version,
  'dir': path.join(repositoryRootPath),
  'icon': getIcon(),
  'ignore': ['dist'],
  'name': Package.name,
  'out': buildOutputPath,
  'overwrite': true,
  'platform': argv.platform,
  'version-string': {
    'CompanyName': Package.name,
    'FileDescription': Package.name,
    'ProductName': Package.name
  }
}


const winstallerOptions = {
  appDirectory: path.join(buildOutputPath, baseName),
  iconUrl: getIcon(),
  loadingGif: path.join(repositoryRootPath, 'app', 'static', 'img', 'gif',
    'installing.gif'),
  outputDirectory: path.join(distOutputPath, argv.platform, argv.arch),
  noMsi: true,
  setupExe: `${baseName}-Setup.exe`,
  remoteReleases: Config.releaseRemoteUrl(argv.arch, argv.platform),
  setupIcon: path.join(repositoryRootPath, 'app', 'static', 'img', 'icon.ico'),
  version: Package.version
}

function getIcon() {
  switch (argv.platform) {
    case 'darwin':
      return path.join(repositoryRootPath, 'app', 'static', 'img', 'icon.icns')
    case 'linux':
      // Don't pass an icon, as the dock/window list icon is set via the icon
      // option in the BrowserWindow constructor in atom-window.coffee.
      return null
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
  if (argv.platform === 'darwin') {
    const appBundleName = `${Package.name}.app`
    const newAppBundleName = `${baseName}.app`
    packagedAppPath = path.join(buildOutputPath, newAppBundleName)
    distAppPath = path.join(distOutputPath, newAppBundleName)

    if (fs.existsSync(packagedAppPath)) fs.removeSync(packagedAppPath)
    fs.renameSync(path.join(packageOutputDirPath, appBundleName),
      packagedAppPath)
    fs.copySync(packagedAppPath,
      distAppPath)
  } else {
    packagedAppPath = path.join(buildOutputPath, baseName)
    if (fs.existsSync(packagedAppPath)) fs.removeSync(packagedAppPath)
    fs.renameSync(packageOutputDirPath, packagedAppPath)
  }
  return packagedAppPath
}

console.log(`Building ${baseName}`)
runPackager(packageOptions)
  .then((packagedAppPath) => {
    console.log('app packaged')
    if (argv.platform == 'win32') {
      winstallerOptions.appDirectory = packagedAppPath;
      winstaller.createWindowsInstaller(winstallerOptions)
    }
  })

return;
