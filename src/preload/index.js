import { contextBridge, ipcMain, ipcRenderer  } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
const { execSync, exec } = require('child_process')

function parseNetstatOutput() {
  try {
    // 使用 PowerShell 命令获取网络适配器的统计信息
    const command = `powershell -Command "Get-NetAdapterStatistics | Select-Object Name, ReceivedBytes, SentBytes"`;
    const result = execSync(command, { encoding: 'utf-8' });
    let trafficTotal = 0
    // 解析结果
    const lines = result.split('\n').filter(line => line.trim() !== '');
    lines.slice(1).forEach(line => {
        const parts = line.split(/\s+/);
        const receivedBytes = parseInt(parts[1], 10);
        const sentBytes = parseInt(parts[2], 10);
        if (!isNaN(receivedBytes)) {
          trafficTotal += trafficTotal
        }
        if (!isNaN(sentBytes)) {
          trafficTotal += sentBytes
        }
    });
    // 转化成MB
    return (trafficTotal / 1024 / 1024).toFixed(2)
  } catch (e) {
    console.log(e.message);
  }
  return 0
}

// 使用 rasdial 命令建立拨号连接
async function diaContent(connectionName, username, password, callback, index) {
  console.log(window, 'preload');
  
  try {
      const command = `rasdial "${connectionName}" "${username}" "${password}"`;
      return exec(command, { encoding: 'utf-8' }, (error, stdout, stderr) => {
        console.log(stdout, 'stdout');
        // 成功
        if (stdout.includes("Successfully connected")) {
          callback(1, index)
        } else {
          callback(3, index)
        }
      });
  } catch (error) {
      if (error.type === "PROCESS_ERROR") {
        console.error("命令执行失败:", error.stderr || error.error.message);
        callback(2, index)
      }
      console.error('拨号连接出错:', error.message);
      callback(4, index)
  }
}

// 使用 rasdial 命令断开拨号连接
function disconnectDialUp(connectionName) {
  try {
      const command = `rasdial "${connectionName}" /DISCONNECT`;
      const result = execSync(command, { encoding: 'utf-8' });

      // 检查是否成功断开
      if (result.includes('Command completed successfully')) {
          console.log('拨号连接已断开:', result.trim());
          return true;
      } else {
          console.error('断开拨号连接失败:', result.trim());
          return false;
      }
  } catch (error) {
      console.error('断开拨号连接出错:', error.message);
      return false;
  }
}

// Custom APIs for renderer
const api = {
  parseNetstatOutput,
  diaContent,
  disconnectDialUp,
  dialUpConnect: (connectionName, username, password) =>
    ipcRenderer.invoke('dial-up-connect', { connectionName, username, password })
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    // contextBridge.exposeInMainWorld('require', require);

  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
