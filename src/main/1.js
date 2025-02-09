import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
// import { BrowserWindow, BrowserView } from 'electron'
// const path = require('path')

// 在开发模式下启用自动重载
// if (process.env.NODE_ENV === 'development') {
//   require('electron-reload')(__dirname, {
//     electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
//     hardResetMethod: 'exit'
//   })
// }


function openNewTab(url) {
  if (newWindow === null || newWindow.isDestroyed()) {
      newWindow = new BrowserWindow({
          width: 800,
          height: 600,
          webPreferences: {
              nodeIntegration: true
          }
      });
      newWindow.loadURL(url);
      newWindow.on('closed', () => {
          newWindow = null;
      });
  } else {
      newWindow.loadURL(url);
  }
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contentSecurityPolicy: "default-src *; script-src'self' 'unsafe-inline' 'unsafe-eval'; style-src'self' 'unsafe-inline'",
      contextIsolation: false,
      // webSecurity: false // 禁用 Web 安全策略以允许所有来源
    }
  })

  // mainWindow.loadURL('https://tv.sohu.com/v/MjAyMjA5MjUvbjYwMTIxNDE4OC5zaHRtbA==.html');

  

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.openDevTools()

  // 禁用缓存
   win.webContents.session.clearCache()
  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

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

  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

globalThis.openNewTab = openNewTab;


// const handleStart = async () => {
  //   if (fileListData.length === 0) {
  //     alert('请先上传正确格式的文件')
  //     return
  //   }
  //   try {
  //     if (isStart) {
  //       return
  //     }
  //     const values = await form.validateFields()
  //     // window.open(values.videoUrl || 'https://www.douyin.com/?recommend=1')
  //     console.log('Success:', values)
  //     // 初始化流量
  //     const mountNetworkTraffic = await window.api.parseNetstatOutput()
  //     lastNetwork.current = mountNetworkTraffic
  //     setIsStart(true)
  //     setCurrentIndex(0)
  //     timerRef.current = setInterval(() => {
  //       // const currentTime = values.time * 60 * 1000
  //       const currentTime = 3000
  //       console.log(currentIndex, 'currentIndex');
  //       if (latestTimeRef.current >= currentTime) {
  //         // 开始下一个账号，重新计时
  //         setCurrentIndex((cur) => {
  //           return cur + 1
  //         })
  //         setTime(0)
  //         statisticFlow(true)
  //         // 是否为最后一个账号如果是清空定时器，恢复默认值
  //         if (latestCur.current >= fileListData.length - 1) {
  //           setIsStart(false)
  //           return
  //         }
  //       }
  //       // 进行拨号连接
  //       const successStatus = window.api.diaContent()
  //       // 成功建立连接，开始统计
  //       if (successStatus === 2) {
  //         console.log(latestTimeRef.current, 'latestTimeRef.current');

  //         setTime((time) => {
  //           return time + 1000
  //         })
  //         statisticFlow()
  //       } else {
  //         // 建立连接失败，换下一个账号
  //         setCurrentIndex((cur) => {
  //           return cur + 1
  //         })
  //         setTime(0)
  //         statisticFlow(true)
  //         // 是否为最后一个账号如果是清空定时器，恢复默认值
  //         if (latestCur.current >= fileListData.length - 1) {
  //           setIsStart(false)
  //           handleEnd()
  //           return
  //         }
  //       }

  //       setTime((time) => {
  //         return time + 1000
  //       })
  //       statisticFlow()
  //     }, 1000)
  //   } catch (errorInfo) {
  //     console.log('Failed:', errorInfo)
  //   }
  // }