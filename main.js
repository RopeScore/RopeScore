const logCatch = require('./log-catch')
const {
  app,
  BrowserWindow,
  dialog,
  autoUpdater,
  Menu
} = require('electron')
const Config = require('./app/config')
const server = require('./server')
const path = require('path')
const url = require('url')
const fs = require('fs-extra')
const dateTo = (Config.Country !== 'intl' ? require('./app/configs/' + Config.Country + '.js') : undefined)

if (require('electron-squirrel-startup')) {

} else {
  app.on('ready', function () {
    if (process.platform !== 'darwin') {
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
          message: 'A new version of RopeScore is available, do you wish to install it now?',
          title: 'Update Available',
          cancelId: 1
        }, function (button) {
          if (button === 0) {
            autoUpdater.quitAndInstall()
          }
        })
      })
      autoUpdater.on('error', (error) => {
        console.log(error)
      })
      autoUpdater.setFeedURL(Config.releaseRemoteUrl())
      if (fs.existsSync(path.resolve(path.dirname(process.execPath), '..',
          'Update.exe'))) {
        autoUpdater.checkForUpdates()
      }
    }
  })
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win = []

function createWindow () {
  if ((Config.Eval && Config.BuildDate && new Date().getTime() > (Number(Config.LicenceDate) + (30 * 24 * 60 * 60 * 1000))) || new Date().getTime() > (Number(dateTo))) {
    dialog.showErrorBox('Expired Licence',
      'This copy of RopeScore has an expired licence,\n Please contact contact@ropescore.com'
    )
    app.quit()
  } else {
    // Create the browser window.
    win.push(new BrowserWindow({
      width: 800,
      height: 600,
      icon: path.join(__dirname, 'app/static/img/icon.png')
    }))

    // and load the index.html of the app.
    /* win.loadURL(url.format({
      pathname: path.join(__dirname, 'app/index.html'),
      protocol: 'file:',
      slashes: true
    })) */
    win[win.length - 1].loadURL(`http://localhost:3333`)

    // Open the DevTools.
    if (Config.Debug) {
      win[win.length - 1].webContents.openDevTools()
      // BrowserWindow.addDevToolsExtension('C:\\Users\\00svbeon\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\ighdmehidhipcmcojjgiloacoafjmpfk\\0.10.9_0')
    }

    // Emitted when the window is closed.
    win[win.length - 1].on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      win.splice(win[win.length - 1], 1)
    })

    /* beautify preserve:start */
    const menu = [
      {
        label: 'Edit',
        role: 'edit',
        submenu: [
          {role: 'undo'},
          {role: 'redo'},
          {type: 'separator'},
          {role: 'cut'},
          {role: 'copy'},
          {role: 'paste'},
          {role: 'pasteandmatchstyle'},
          {role: 'delete'},
          {role: 'selectall'}
        ]
      },
      {
        label: 'View',
        role: 'view',
        submenu: [
          {role: 'reload'},
          {role: 'forcereload'},
          {type: 'separator'},
          {role: 'resetzoom'},
          {role: 'zoomin'},
          {role: 'zoomout'},
          {type: 'separator'},
          {role: 'togglefullscreen'}
        ]
      },
      {
        role: 'window',
        submenu: [
          {
            label: 'New',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              createWindow()
            }
          },
          {role: 'minimize'},
          {role: 'close'}
        ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'Documentation',
            accelerator: 'F1',
            click: function (item, focusedWindow) {
              if (focusedWindow) { focusedWindow.loadURL('http://localhost:3333/docs') }
            }
          },
          {
            label: 'Report Bugs',
            click: function (item, focusedWindow) {
              if (focusedWindow) {
                focusedWindow.loadURL('http://localhost:3333/bugreport')
              }
            }
          },
          {
            label: 'Licence',
            click: function (item, focusedWindow) {
              if (focusedWindow) {
                focusedWindow.loadURL('http://localhost:3333/licence')
              }
            }
          }
        ]
      }
    ]

    if (Config.Debug) {
      const viewMenu = menu.find(function (m) {
        return m.role === 'view'
      })
      if (viewMenu) {
        viewMenu.submenu.push({role: 'toggledevtools'})
      }
    }

    if (process.platform === 'darwin') {
      const name = app.getName()
      menu.unshift({
        label: app.getName(),
        submenu: [
          {role: 'about'},
          {type: 'separator'},
          {role: 'services', submenu: []},
          {type: 'separator'},
          {role: 'hide'},
          {role: 'hideothers'},
          {role: 'unhide'},
          {type: 'separator'},
          {role: 'quit'}
        ]
      })
      const windowMenu = menu.find(function (m) {
        return m.role === 'window'
      })
      const editMenu = menu.find(function (m) {
        return m.role === 'edit'
      })
      if (windowMenu) {
        windowMenu.submenu = [
          {
            label: 'New',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              createWindow()
            }
          },
          {role: 'close'},
          {role: 'minimize'},
          {role: 'zoom'},
          {type: 'separator'},
          {role: 'front'}
        ]
      }
      if (editMenu) {
        editMenu.submenu.push(
          {type: 'separator'},
          {
            label: 'Speech',
            submenu: [
              {role: 'startspeaking'},
              {role: 'stopspeaking'}
            ]
          }
        )
      }
    }
    /* beautify preserve:end */

    Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

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
