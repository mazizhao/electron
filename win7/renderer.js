const XLSX = require('xlsx')
const path = require('path')
const fs = require('fs');
const si = require('systeminformation');

const { execSync, exec } = require('child_process')

let formData = {}
let fileList = []
let errorList = []
let timeCur = 0;
let isStart = false

//默认
function init(flag = true) {
    if (flag) {
        alert('当前文件已全部执行结束')
    }
    timeCur = 0
    document.querySelector('#curname').innerHTML = '--'
    document.querySelector('#lossTime').innerHTML = '--'
    document.querySelector('#network').innerHTML = '--'
    document.querySelector('#upload').disabled = false;
    document.querySelector('#name').disabled = false;
    document.querySelector('#maxTime').disabled = false;
    document.querySelector('#bps').disabled = false;
    document.querySelector('#videoUrl').disabled = false;
}

const millisecondsToTim = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    // 格式化为两位数
    const formattedHours = String(hours).padStart(2, '0')
    const formattedMinutes = String(minutes).padStart(2, '0')
    const formattedSeconds = String(seconds).padStart(2, '0')

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
}

// 校验是否过期
let overtime = true;
const isExpire = async () => {
    try {
        const url = 'https://www.yuque.com/api/docs/mmgv4l?include_contributors=true&include_like=true&include_hits=true&merge_dynamic_data=false&book_id=20324772'
        window.fetch(url)
            .then(response => response.json())
            .then(data => {
                overtime = (data?.data?.description || '').includes('移动win7')
                if (overtime) {
                    timeover.style.display = 'none'
                } else {
                    document.querySelector('.content').style.display = 'none'
                    document.querySelector('#timeover').style.display = 'block'
                    init(false)
                }
            })
            .catch(error => console.error('Error:', error));
    } catch (error) {
        console.log(error);
    }
}
isExpire();

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
// 使用 rasdial 命令建立拨号连接
async function diaContent(connectionName, username, password, callback, index) {
    try {
        // const command = `chcp 65001>nul && rasdial "${connectionName}" /DISCONNECT`;
        const command = `chcp 65001>nul && rasdial "${connectionName}" "${username}" "${password}"`;
        // const command = `rasdial "${connectionName}" "${username}" "${password}"`;
        return exec(command, { encoding: 'utf-8' }, (error, stdout, stderr) => {
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

// 开始按钮
start.onclick = async () => {
    if (isStart) {
        alert('正在运行中，请勿重复点击')
        return;
    }
    if (!fileList.length) {
        return alert('请先上传文件')
    }
    const name = form.elements.name.value;
    const maxTime = form.elements.maxTime.value;
    const bps = form.elements.bps.value;
    const videoUrl = form.elements.videoUrl.value;
    if (!bps || bps < 0) {
        return alert('流量上限必填且必须大于0')
    }
    if (!maxTime || maxTime < 0) {
        return alert('时间上限必填且必须大于0')
    }
    if (name && videoUrl) {
        formData.name = name
        formData.maxTime = maxTime
        formData.bps = bps
        formData.videoUrl = videoUrl
        errorList = []
        isStart = true;
        document.querySelector('#upload').disabled = true;
        document.querySelector('#name').disabled = true;
        document.querySelector('#maxTime').disabled = true;
        document.querySelector('#bps').disabled = true;
        document.querySelector('#videoUrl').disabled = true;
        form.disabled = true;
        await disconnectDialUp(formData.name) // 断开链接
        // 进行拨号连接
        const curItem = fileList[0]
        await diaContent(formData.name, curItem.account, curItem.password, callbackNet, 0)
    } else {
        alert('请补全表单')
    }
}

let intervalId = null
let timerTime = 0;
// 统计时间
function sumTime() {
    const nowTime = new Date().getTime() - timerTime
    document.querySelector('#lossTime').innerHTML = `${millisecondsToTim(nowTime)}`
}
const processItem = async (index) => {
    const mountNetworkTraffic = await parseNetstatOutput()
    lastNetwork = mountNetworkTraffic
    const currentTime = (formData.maxTime || 1) * 60 * 1000
    let count = 0
    intervalId = setInterval(() => {
        count += 1000
        statisticFlow()
        sumTime()
        document.querySelector('#curname').innerHTML = `${fileList?.[timeCur]?.account || '--'}`
        console.log(count, currentTime, networkTraffic, 'kkkkk', formData.bps, count >= currentTime && networkTraffic >= formData.bps);
        console.log(fileList[timeCur].account, '当前账号');
        
        if (count >= currentTime && networkTraffic >= formData.bps) {
            clearInterval(intervalId)
            timeCur += 1
            disconnectDialUp(formData.name)
            if (timeCur <= fileList.length - 1) {
                timerTime = new Date().getTime()
                // diaContent(formData.name, fileList[timeCur]?.account, fileList[timeCur]?.password, callbackNet, timeCur)
                diaContent(formData.name, fileList[timeCur].account, fileList[timeCur].password, callbackNet, timeCur)
            } else {
                init()
            }
        }
    }, 1000)
    
    // return new Promise((resolve) => {
    //     intervalId = setInterval(async () => {
    //         count += 1000
    //         statisticFlow()
    //         // document.querySelector('#curname').innerHTML = `${fileList?.[timeCur]?.account || '--'}`
    //         document.querySelector('#curname').innerHTML = `${fileList[timeCur].account || '--'}`
            
    //         // if (count >= currentTime && networkTraffic > formData.bps) {
    //         if (count >= currentTime || networkTraffic > formData.bps) {
    //             clearInterval(intervalId)
    //             timeCur += 1
    //             await disconnectDialUp(formData.name)
    //             if (timeCur <= fileList.length - 1) {
    //                 clearInterval(sumTimerOnly)
    //                 // await diaContent(formData.name, fileList[timeCur]?.account, fileList[timeCur]?.password, callbackNet, timeCur)
    //                 await diaContent(formData.name, fileList[timeCur].account, fileList[timeCur].password, callbackNet, timeCur)
    //             } else {
    //                 init()
    //             }
    //             resolve()
    //         }
    //     }, 1000)
    // })
}

let urlOpen = false
const callbackNet = async (e, index) => {
    console.log(e, index, 'hhhhh');
    if (!overtime) {
        return
    }
    
    // 成功
    if (e === 1) {
        isExpire()
        // 计算流量，先清零，再计算
        timerTime = new Date().getTime()
        document.querySelector('#lossTime').innerHTML = `00：00：00`
        lastNetwork = await parseNetstatOutput()
        if (!urlOpen) {
            window.open(formData.videoUrl || 'https://www.douyin.com/?recommend=1')
            urlOpen = true
        }
        processItem(index)
    } else {
        // 连接失败
        console.log('连接失败', index, '索引');
        errorList.push(fileList[timeCur])
        errorListContext()

        timeCur += 1
        console.log(timeCur, 'timeCur当前索引');
        
        if (timeCur > fileList.length - 1) {
            init()
        } else {
            lastNetwork = await parseNetstatOutput()
            document.querySelector('#network').innerHTML = '--'
            diaContent(formData.name, fileList[timeCur]?.account, fileList[timeCur]?.password, callbackNet, timeCur)
        }
    }
}

// 上传文件
function handleFile(e) {
    // 获取文件对象
    const file = e.target.files[0];
    if (!file) return;

    // 定义允许的最大大小（这里以1MB为例）
    const maxSize = 1024 * 1024 * 5; // 1MB = 1024KB * 1024B
    if (file) {
        // 校验文件大小
        if (file.size > maxSize) {
            alert('文件大小不能超过 1MB');
            // 清空已选文件
            e.target.value = '';
        }
    }

    const reader = new FileReader()
    reader.onload = (e) => {
        const binaryStr = e.target.result
        const workbook = XLSX.read(binaryStr, { type: 'binary' })
        const sheetNames = workbook.SheetNames
        const arrData = []
        sheetNames.forEach((item) => {
            const worksheet = workbook.Sheets[item]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)
            arrData.push(jsonData)
        })
        fileList = arrData.flat(Infinity)
        // 显示结果
        let str = ''
        fileList.forEach(item => {
            str += `<div>
                <span>账号：${item.account}</span>
                <span class='password'>密码：${item.password}</span>
            </div>`
        })
        document.getElementById('output').innerHTML = str
    }
    reader.readAsBinaryString(file)
}
document.getElementById('upload').addEventListener('change', handleFile)

// 存在错误账号，则展示
function errorListContext() {
    let str = ''
    if (errorList.length) {
        document.querySelector('.right-content').style.display = 'block'
        errorList.forEach(item => {
            str += `<div>
                <span>账号：${item.account}</span>
                <span class='password'>密码：${item.password}</span>
            </div>`
        })
        document.getElementById('errorList').innerHTML = str
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
    const pathArr = normalizedPath.split('/')
    const lastName = pathArr[pathArr.length - 1]
    const index = normalizedPath.indexOf(lastName);

    const fileName = `错误账号_${new Date().getTime()}.xlsx`;
    const filePath = path.join(normalizedPath.slice(0, index), fileName);
    fs.writeFile(filePath, Buffer.from(fileBuffer, 'utf8'), (err) => {
        if (err) throw err;
        const workbook = XLSX.utils.book_new(); // 创建新工作簿
        const worksheet = XLSX.utils.aoa_to_sheet(fileBuffer); // 将数据转换为工作表
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1"); // 将工作表添加到工作簿
        XLSX.writeFile(workbook, filePath);
        alert(`文件名：错误账号_${new Date().getTime()}，文件已保存`);
    });
}
document.querySelector('#error-btn').onclick = () => {
    try {
        downloadErrorFile(errorList)
    } catch (e) {
        console.log(e, e.message);
        alert(e.message + '请联系管理员')
    }
}

// 统计流量
let networkTraffic = 0;
let lastNetwork = 0;
async function parseNetstatOutput() {
    const stats = await si.networkStats();
    const currentRx = stats.reduce((sum, iface) => sum + iface.rx_bytes, 0);
    const currentTx = stats.reduce((sum, iface) => sum + iface.tx_bytes, 0);
    return (currentRx || 0) + (currentTx || 0)
    
    // try {
    //     // 使用 PowerShell 命令获取网络适配器的统计信息
    //     const command = `powershell -Command "Get-NetAdapterStatistics | Select-Object Name, ReceivedBytes, SentBytes"`;
    //     const result = execSync(command, { encoding: 'utf-8' });
    //     let trafficTotal = 0
    //     // 解析结果
    //     const lines = result.split('\n').filter(line => line.trim() !== '');
    //     lines.slice(1).forEach(line => {
    //         const parts = line.split(/\s+/);
    //         const receivedBytes = parseInt(parts[1], 10);
    //         const sentBytes = parseInt(parts[2], 10);
    //         if (!isNaN(receivedBytes)) {
    //             trafficTotal += trafficTotal
    //         }
    //         if (!isNaN(sentBytes)) {
    //             trafficTotal += sentBytes
    //         }
    //     });
    //     // 转化成MB
    //     return (trafficTotal / 1024 / 1024).toFixed(2)
    // } catch (e) {
    //     console.log(e.message);
    //     return 0
    // }
}
const statisticFlow = async () => {
    const totalNetworkTraffic = await parseNetstatOutput()
    networkTraffic = ((totalNetworkTraffic - lastNetwork)/ 1024 / 1024).toFixed(2)
    document.querySelector('#network').innerHTML = `${networkTraffic}`
}
// 耗时
let domTime = document.querySelector('.time')

