import { app, shell, BrowserWindow, ipcMain, ipcRenderer } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
// 拨号连接
const { exec } = require('child_process');


function createSecondWindow() {
  // 创建第二个窗口，用于嵌入其他页面
  const secondWindow = new BrowserWindow({
      width: 800,
      height: 800,
      webPreferences: {
          nodeIntegration: true, // 注意：出于安全考虑，最好关闭 nodeIntegration 并使用预加载脚本来暴露 API
          contextIsolation: false // 同上，最好改为 true 并使用 contextBridge 或 preload 脚本
      }
  });
  secondWindow.loadURL('https://tv.sohu.com/v/MjAyMjA5MjUvbjYwMTIxNDE4OC5zaHRtbA==.html'); // 加载外部网页或本地 HTML 文件
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contentSecurityPolicy: "default-src *; script-src'self' 'unsafe-inline' 'unsafe-eval'; style-src'self' 'unsafe-inline'",
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.openDevTools()
  // // 禁用缓存
  // win.webContents.session.clearCache()

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 拨号连接相关信息
  const connectionName = '你的PPPoE连接名称';
  const username = '你的用户名';
  const password = '你的密码';

  // 执行拨号命令
  const dialCommand = `rasdial ${connectionName} ${username} ${password}`;
  exec(dialCommand, (error, stdout, stderr) => {
      if (error) {
          console.error('执行拨号命令出错:', error.message);
          return;
      }
      if (stderr) {
          console.error('标准错误输出:', stderr);
      }
      console.log('标准输出:', stdout);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')


  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))


  // 监听拨号连接请求
  ipcMain.handle('dial-up-connect', async (event, { connectionName, username, password }) => {
    const { exec } = require('child_process').promises;
    try {
      return setTimeout(() => {
        return 1
      }, 1000);
      // const command = `rasdial "${connectionName}" "${username}" "${password}"`;
      // return exec(command, { encoding: 'utf-8' }, (error, stdout, stderr) => {
      //   if (error) {
      //     return 2
      //   }
      //   if (stderr) {
      //     return 3
      //   }
      //   return 1
      // });
    } catch (error) {
      return 4
    }
  });

  createWindow()
  // createSecondWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})




// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process