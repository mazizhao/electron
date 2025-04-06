import { useState, useEffect, useRef } from 'react'
import { Button, Upload, Card, Alert, Form, Input, InputNumber, Flex, Spin } from 'antd'
import * as XLSX from 'xlsx'
import { millisecondsToTim } from './utils'
import axios from 'axios'
import styles from './index.module.css'

function Versions() {
  const [file, setFile] = useState([])
  const [form] = Form.useForm()
  const [fileListData, setFileListData] = useState([])
  const [time, setTime] = useState(0)
  const [isStart, setIsStart] = useState(false)
  const [networkTraffic, setNetworkTraffic] = useState(0)
  const [errorList, setErrorList] = useState([])
  const lastNetwork = useRef(0)
  const [current, setCurrent] = useState(-1)
  const [isHasTime, setIsHasTime] = useState(true)

  // 读取并解析文件
  const [loading, setLoading] = useState(false)
  const handleBeforeUpload = (file) => {
    const isSize5M = (file?.size / 1024 /1024).toFixed()
    if (isSize5M >= 5) {
      alert('文件大小不能超过5M')
      return false
    }
    setLoading(true)
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
      console.log(arrData, '文件')
      const formatArr = arrData.flat(Infinity)
      setFileListData(formatArr)
      setLoading(false)
    }
    reader.readAsBinaryString(file)
    setFile([
      {
        name: file.name,
        status: 'done'
      }
    ])
  }
  
  
  const newWorkRef = useRef(0)
  useEffect(() => {
    newWorkRef.current = networkTraffic
  }, [networkTraffic])

  const processItem = async (index) => {
    const values = await form.validateFields()
    const mountNetworkTraffic = await window.api.parseNetstatOutput()
    lastNetwork.current = mountNetworkTraffic
    const currentTime = (values.time || 1) * 60 * 1000
    let count = 0
    return new Promise((resolve) => {
      const intervalId = setInterval(async () => {
        count += 1000
        setTime((time) => {
          return time + 1000
        })
        if (count >= currentTime && newWorkRef.current > values.bps) {
          if (index >= fileListData.length - 1) {
            setIsStart(false)
          }
          clearInterval(intervalId)
          await window.api.disconnectDialUp('宽带连接')
          window.api.diaContent('宽带连接', fileListData[index + 1]?.account, fileListData[index + 1]?.password, callbackNet, index + 1)
          resolve()
        }
      }, 1000)
    })
  }
  const [isNet, setIsNet] = useState(false)
  const [networkStatus, setNetworkStatus] = useState(0)
  const callbackNet = async (e, index) => {
    handleOnClick();
    if (index + 1 > fileListData.length) {
      setTime(0)
      setIsStart(false)
      return
    }
    setNetworkStatus(e)
    setCurrent(index)
    const values = await form.validateFields()
    // 成功
    if (e === 1) {
      if (!index) {
        window.open(values.videoUrl || 'https://www.douyin.com/?recommend=1')
        setIsNet(true)
      }
      await processItem(index)
      setTime(0)
      setNetworkTraffic(0)
    } else {
      // 连接失败
      console.log('连接失败', index, '索引', networkStatus, "状态", fileListData[index]);
      setErrorList((arr) => {
        return [...arr, fileListData[index]]
      })
      window.api.diaContent('宽带连接', fileListData[index + 1]?.account, fileListData[index + 1]?.password, callbackNet, index + 1)
    }
  }


  const onRemove = () => {
    setFile([])
    setFileListData([])
  }


  

}

export default Versions