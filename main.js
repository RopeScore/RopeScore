const {
  app,
  BrowserWindow,
  dialog,
  autoUpdater,
  globalShortcut
} = require('electron')
const server = require("./server")
const Config = require('./app/config')
const path = require('path')
const url = require('url')
const fs = require('fs-extra')

if (require('electron-squirrel-startup')) {
  return
} else {
  app.on('ready', function() {
    if (process.platform != 'darwin') {
      autoUpdater.on('checking-for-update', () => {
        console.log('checking for updates')
      })
      autoUpdater.on('update-available', () => {
        console.log('downloading update')
      })
      autoUpdater.on('update-downloaded', () => {
        console.log('update-downloaded')
        dialog.showMessageBox({
          buttons: ['Install', 'Not now'],
          defaultId: 0,
          message: 'A new version of RopeScore is avilabel, do you wish to install it now?',
          title: 'Update Avilable',
          cancelId: 1
        }, function(button) {
          if (button == 0) {
            autoUpdater.quitAndInstall()
          }
        })
      })
      autoUpdater.setFeedURL(Config.releaseRemoteUrl())
      if (fs.existsSync(path.resolve(path.dirname(process.execPath), '..',
          'Update.exe'))) {
        dialog.showErrorBox('Squirrel', 'App installed with Squirrel')
        autoUpdater.checkForUpdates()
      }
    }
  })
}


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win = [];

function createWindow() {
  if (Config.Eval && Config.LicenceDate && new Date()
    .getTime() > (Number(Config.LicenceDate) + (30 * 24 * 60 * 60 * 1000))) {
    dialog.showErrorBox('Expired Licence',
      'This copy of RopeScore has an expired licence,\n Please contact ropescore@swant.pw'
    );
    app.quit();
  } else {

    // Create the browser window.
    win.push(new BrowserWindow({
      width: 800,
      height: 600,
      icon: path.join(__dirname, 'app/static/img/icon.png')
    }))

    // and load the index.html of the app.
    /*win.loadURL(url.format({
      pathname: path.join(__dirname, 'app/index.html'),
      protocol: 'file:',
      slashes: true
    }))*/
    win[win.length - 1].loadURL(`http://localhost:3333`)

    // Open the DevTools.
    if (Config.Debug) {
      win[win.length - 1].webContents.openDevTools()
    }

    // Emitted when the window is closed.
    win[win.length - 1].on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      win.splice(win[win.length - 1], 1)
    })
  }
}

function shortcuts() {
  const ret = globalShortcut.register('CommandOrControl+N', () => {
    console.log('CommandOrControl+N is pressed')
    createWindow()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)
app.on('ready', shortcuts)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  console.log(win)
  if (win.length === 0 || win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
