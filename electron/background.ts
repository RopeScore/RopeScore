import { app, protocol, BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions } from 'electron'
import { autoUpdater } from 'electron-updater'
import * as path from 'path'
import { accessSync, constants } from 'fs'
import { getType } from 'mime/lite'

const isDevelopment = process.env.NODE_ENV === 'development'

app.disableHardwareAcceleration()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const win = new Map<number, BrowserWindow>()

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

function createWindow () {
  // Create the browser window.
  const newWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    icon: path.join(__dirname, '../src/assets/icon.png')
  })
  const winId = newWin.id

  win.set(winId, newWin)

  if (isDevelopment) {
    // newWin.loadURL('http://localhost:5050')
    newWin.loadURL('app://index.html')
    newWin.webContents.openDevTools()
  } else {
    // Load the index.html when not in development
    newWin.loadURL('app://index.html')
    autoUpdater.checkForUpdatesAndNotify()
  }

  newWin.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win.delete(winId)
  })

  const menu: Array<MenuItemConstructorOptions | MenuItem> = [
    {
      role: 'editMenu',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' }
      ]
    },
    {
      role: 'viewMenu',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' }
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
        {
          label: 'Print',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            newWin.webContents.print()
          }
        },
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
    // TODO
    // {
    //   role: 'help',
    //   submenu: [
    //     {
    //       label: 'Documentation',
    //       accelerator: 'F1',
    //       click: function (item: MenuItem, focusedWindow?: BrowserWindow) {
    //         // if (focusedWindow) { focusedWindow.loadURL('http://localhost:3333/docs') }
    //       }
    //     },
    //     {
    //       label: 'Report Bugs',
    //       click: function (item: MenuItem, focusedWindow?: BrowserWindow) {
    //         if (focusedWindow) {
    //           // focusedWindow.loadURL('http://localhost:3333/bugreport')
    //         }
    //       }
    //     }
    //   ]
    // }
  ]

  if (process.platform === 'darwin') {
    const name: string = app.getName()
    menu.unshift({
      label: name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' as 'hide' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })
    const windowMenu = menu.find(function (m) {
      return m.role === 'window'
    })
    const editMenu = menu.find(function (m) {
      return m.role === 'editMenu'
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
        {
          label: 'Print',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            newWin.webContents.print()
          }
        },
        { role: 'close' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
    if (editMenu && Array.isArray(editMenu.submenu)) {
      editMenu.submenu.push(
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      )
    }
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
}

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
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  if (isDevelopment) {
    // Install Vue Devtools
    const { default: installExtension, VUEJS3_DEVTOOLS, APOLLO_DEVELOPER_TOOLS } = await import('electron-devtools-installer')
    try {
      await installExtension(VUEJS3_DEVTOOLS)
      await installExtension(APOLLO_DEVELOPER_TOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e)
    }
  }

  const indexPath = path.normalize(path.resolve(__dirname, '..', isDevelopment ? 'dist/render' : 'render', 'index.html'))
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.substr(6).replace(/\/$/, '').replace(/^index\.html\/(.+)/, '$1')
    const p = path.normalize(path.resolve(__dirname, '..', isDevelopment ? 'dist/render' : 'render', url))
    try {
      accessSync(p, constants.R_OK)
      const mimeType = getType(p) ?? undefined
      console.log(p, mimeType)
      // eslint-disable-next-line n/no-callback-literal
      callback({ path: p, mimeType })
    } catch {
      // eslint-disable-next-line n/no-callback-literal
      callback({ path: indexPath })
    }
  })

  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
