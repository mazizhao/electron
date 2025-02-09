import { useState, useEffect, useRef, useMemo } from 'react'
import { Button, Upload, Card, Alert, Form, Input, InputNumber, Flex } from 'antd'
import * as XLSX from 'xlsx'
import { millisecondsToTim } from './utils'
import styles from './index.module.css'

function Versions() {
  const [file, setFile] = useState([])
  const [form] = Form.useForm()
  const [fileListData, setFileListData] = useState([
    // { account: 'xxxx', password: 'ccc'},
    // { account: 'xbbbbxxx', password: 'cbbbbcc'},
  ])
  const [time, setTime] = useState(0)
  const [isStart, setIsStart] = useState(false)
  const [networkTraffic, setNetworkTraffic] = useState(0)
  const [errorList, setErrorList] = useState([])
  const lastNetwork = useRef(0)
  const [currentAccount, setCurentAccount] = useState({})
  const [current, setCurrent] = useState(-1)

  // 计算流量
  const statisticFlow = async (isRecord) => {
    const totalNetworkTraffic = await window.api.parseNetstatOutput()
    if (isRecord) {
      lastNetwork.current = totalNetworkTraffic
    }
    console.log(totalNetworkTraffic, '流量消耗', networkTraffic, lastNetwork.current)
    setNetworkTraffic((totalNetworkTraffic - lastNetwork.current).toFixed(2))
  }
  // 读取并解析文件
  const handleBeforeUpload = (file) => {
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
    }
    reader.readAsBinaryString(file)
    setFile([
      {
        name: file.name,
        status: 'done'
      }
    ])
    return false
  }
  
  const handleStart = async () => {
    if (fileListData.length === 0) {
      alert('请先上传正确格式的文件')
      return
    }
    try {
      if (isStart) {
        return
      }
      setIsStart(true)
      const values = await form.validateFields()
      // window.open(values.videoUrl || 'https://www.douyin.com/?recommend=1')
      // 初始化流量
      const mountNetworkTraffic = await window.api.parseNetstatOutput()
      lastNetwork.current = mountNetworkTraffic
      // for (let index = 0; index < fileListData.length; index++) {
      //   setCurentAccount(fileListData[index])
      //   setTime(0)
      //   statisticFlow(true)
      // 先断开连接再进行拨号链接
      // window.api.disconnectDialUp(values.networkName)
      // 进行拨号连接
      const curItem = fileListData[0]
      const successStatus = window.api.diaContent(values.networkName, curItem.account, curItem.password, callbackNet, 0)
      //   if (successStatus !== 2) {
      //     setErrorList((currentArr) => {
      //       return [...currentArr, curItem]
      //     })
      //     if (index === fileListData.length - 1) {
      //       setTime(0)
      //       setCurentAccount({})
      //       setNetworkTraffic(0)
      //       setIsStart(false)
      //     }
      //     continue
      //   } else {
      //     await processItem(index)
      //   }
      // }
    } catch (errorInfo) {
      console.log('Failed:', errorInfo)
    }
  }

  async function processItem(index) {
    const values = await form.validateFields()
    // const currentTime = values.time * 60 * 1000
    const currentTime = values.time
    let count = 0
    return new Promise((resolve) => {
      const intervalId = setInterval(() => {
        count += 1000
        setTime((time) => {
          return time + 1000
        })
        statisticFlow()
        if (count >= currentTime) {
          if (index >= fileListData.length - 1) {
            setIsStart(false)
          }
          clearInterval(intervalId)
          resolve()
        }
      }, 1000)
    })
  }

  const [networkStatus, setNetworkStatus] = useState(0)
  const callbackNet = async (e, index) => {
    console.log(e, 'callbasck', index);
    if (index + 1 > fileListData.length) {
      setTime(0)
      setIsStart(false)
      return
    }
    setNetworkStatus(e)
    setCurrent(index)
    // 成功
    if (e === 1) {
      await processItem(index)
      setTime(0)
      window.api.diaContent('宽带连接', fileListData[index + 1].account, fileListData[index + 1].password, callbackNet, index + 1)
    }
    // 连接失败
    if ([2, 3, 4].includes(e)) {
      console.log(index, '索引', networkStatus, "状态", fileListData[index]);
      setErrorList((arr) => {
        return [...arr, fileListData[index]]
      })
      window.api.diaContent('宽带连接', fileListData[index + 1]?.account, fileListData[index + 1]?.password, callbackNet, index + 1)
    }
  }

  return (
    <Flex gap="middle">
      <Card>
        {isStart ? <Alert className={styles.alert} message="计时已开始" type="warning" /> : null}
        <div>
          <Button className={styles.start} onClick={handleStart}>
            开始
          </Button>
        </div>
        <div>耗时：{millisecondsToTim(time)}</div>
        <Form form={form} disabled={isStart} initialValues={{ time: 10000, bps: 30, videoUrl: 'https://www.douyin.com/?recommend=1', networkName: '宽带连接' }}>
          <Form.Item label="宽带连接名称" name="networkName" rules={[{ required: true, message: '必填' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            disabled={isStart}
            label="时间上限"
            name="time"
            rules={[{ required: true, message: '必填' }]}
          >
            <InputNumber addonAfter="分钟" min="1" max="9999999" />
          </Form.Item>
          <Form.Item label="流量上限" name="bps" rules={[{ required: true, message: '必填' }]}>
            <InputNumber addonAfter="MB" min="1" max="9999999" />
          </Form.Item>
          <Form.Item label="视频链接" name="videoUrl" rules={[{ required: true, message: '必填' }]}>
            <Input />
          </Form.Item>
        </Form>
        <div className={styles.consumption}>
          当前正在消耗流量的账号：{fileListData?.[current]?.account || '--'}
        </div>
        <div className={styles.consumption}>累计消耗流量：{networkTraffic} MB</div>
        <Upload
          type="primary"
          fileList={file}
          accept=".xlsx"
          maxCount={1}
          beforeUpload={handleBeforeUpload}
        >
          <Button>选择文件</Button>
        </Upload>
        <div className={styles.fileContent}>
          {fileListData.map((item, index) => (
            <div key={index}>
              <span>账号：{item.account}</span>
              <span className={styles.password}>密码：{item.password}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className={styles.errorContent}>
        <div className={styles.error}>错误账号</div>
        <div className={styles.bg}>
          {errorList.map((item, index) => (
            <div key={index}>
              <span>账号：{item.account}</span>
              <span className={styles.password}>密码：{item.password}</span>
            </div>
          ))}
        </div>
      </Card>
    </Flex>
  )
}

export default Versions