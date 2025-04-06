const { contextBridge } = require('electron');
const XLSX = require('xlsx');

// 解析文件
const readXLSX = (data) => {
    const workbook = XLSX.read(data, { type: 'binary' })
    // const sheetNames = workbook.SheetNames
    // const arrData = []
    // sheetNames.forEach((item) => {
    // const worksheet = workbook.Sheets[item]
    // const jsonData = XLSX.utils.sheet_to_json(worksheet)
    // arrData.push(jsonData)
    // })
    // console.log(arrData, '文件')
    // const formatArr = arrData.flat(Infinity)
    console.log(data, 'formatArr');

}

// Custom APIs for renderer
const api = {
    readXLSX
}

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    window.api = api
}
