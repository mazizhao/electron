const { app, BrowserWindow, ipcMain } = require('electron')
const { join } = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      webSecurity: false, // 关闭同源策略
      nodeIntegration: true,
      contextIsolation: false,
      contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://www.yuque.com;",
      additionalArguments: `--disable-web-security --user-data-dir=""`, 
      nodeIntegrationInWorker: true, // 根据需要设置
      preload: join(__dirname, 'preload.js'),
    }
  })
  win.loadFile('index.html')
  // win.webContents.openDevTools()
}
app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong')
  createWindow()
})


