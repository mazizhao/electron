import { contextBridge, ipcMain, ipcRenderer  } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
const { execSync, exec } = require('child_process')
const XLSX = require('xlsx'); 
const path = require('path');
const fs = require('fs');
const iconv = require('iconv-lite')

// 请求数据
const { net } = require('electron');

function electronCurl(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    net.request({
      method,
      url
    }).then(res => {
      console.log(res);
    })
  });
}

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
  console.log('aaaaaaapreload', connectionName, username, password);
  
  try {
      // const command = `chcp 65001>nul && rasdial "${connectionName}" /DISCONNECT`;
      const command = `chcp 65001>nul && rasdial "${connectionName}" "${username}" "${password}"`;
      // const command = `rasdial "${connectionName}" "${username}" "${password}"`;
      return exec(command, { encoding: 'utf-8' }, (error, stdout, stderr) => {
        console.log(stdout, 'stdout链接状态', iconv.decode(stdout, 'cp936'), String(stdout));
        // 成功
        if (stdout.includes("successfully") || stdout.includes("成功")) {
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
    console.log('命令断开拨号连接', connectionName)
      const command = `chcp 65001>nul && rasdial "${connectionName}" /DISCONNECT`;
      // const command = `rasdial "${connectionName}" /DISCONNECT`;
      const result = execSync(command, { encoding: 'utf-8' });
      console.log(result, 'result', connectionName)
      // 检查是否成功断开
      if (result.includes('successfully')) {
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

// 下载错误文件
async function downloadErrorFile(buffer) {
  const fileBuffer = [
    ["account", "password"],
  ]
  buffer.forEach(item => {
    fileBuffer.push([item.account || '', item.password || ''])
  })
  // 将路径统一转换为正斜杠格式
  const normalizedPath = path.join(__dirname).split(path.sep).join('/');
  // 查找子字符串位置
  const index = normalizedPath.indexOf('electron-app');
  const fileName = `error.xlsx`;
  const filePath = path.join(normalizedPath.slice(0, index), fileName);
  fs.writeFile(filePath,  Buffer.from(fileBuffer, 'utf8'), (err) => {
    if (err) throw err;
    const workbook = XLSX.utils.book_new(); // 创建新工作簿
    const worksheet = XLSX.utils.aoa_to_sheet(fileBuffer); // 将数据转换为工作表
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1"); // 将工作表添加到工作簿
    XLSX.writeFile(workbook, filePath);
      alert('文件已保存');
    });
}

// Custom APIs for renderer
const api = {
  parseNetstatOutput,
  diaContent,
  disconnectDialUp,
  downloadErrorFile,
  electronCurl,
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
