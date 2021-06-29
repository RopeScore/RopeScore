import { app, protocol, BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { autoUpdater } from "electron-updater"
import * as path from 'path'

const isDevelopment = process.env.NODE_ENV !== 'production'

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
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION as boolean | undefined
    },
    icon: path.join(__dirname, '../src/assets/icon.png')
  })
  win.set(newWin.id, newWin)

  const winId = newWin.id

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    newWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    if (!process.env.IS_TEST) newWin.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    newWin.loadURL('app://./index.html')
    autoUpdater.checkForUpdatesAndNotify()
  }

  newWin.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win.delete(winId)
  })

  const menu: (MenuItemConstructorOptions | MenuItem)[] = [
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
        { role: 'togglefullscreen' }
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
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Documentation',
          accelerator: 'F1',
          click: function (item: MenuItem, focusedWindow?: BrowserWindow) {
            // if (focusedWindow) { focusedWindow.loadURL('http://localhost:3333/docs') }
          }
        },
        {
          label: 'Report Bugs',
          click: function (item: MenuItem, focusedWindow?: BrowserWindow) {
            if (focusedWindow) {
              // focusedWindow.loadURL('http://localhost:3333/bugreport')
            }
          }
        },
        {
          label: 'Licence',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              // focusedWindow.loadURL('http://localhost:3333/licence')
            }
          }
        }
      ]
    }
  ]

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    const viewMenu = menu.find(function (m) {
      return m.role === 'viewMenu'
    })
    if (viewMenu && Array.isArray(viewMenu.submenu)) {
      viewMenu.submenu.push({ role: 'toggleDevTools' })
    }
  }

  if (process.platform === 'darwin') {
    const name: string = app.getName()
    menu.unshift(<MenuItemConstructorOptions | MenuItem>{
      label: name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
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
  /* beautify preserve:end */

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
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    const { default: installExtension, VUEJS_DEVTOOLS } = await import('electron-devtools-installer')
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
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
