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

  // 计算流量
  const statisticFlow = async (isRecord) => {
    const totalNetworkTraffic = await window.api.parseNetstatOutput()
    if (isRecord) {
      lastNetwork.current = totalNetworkTraffic
    }
    setNetworkTraffic((totalNetworkTraffic - lastNetwork.current).toFixed(2))
  }
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
  
  const handleStart = async () => {
    if (fileListData.length === 0) {
      alert('请先上传正确格式的文件')
      return
    }
    setErrorList([])
    try {
      if (isStart) {
        return
      }
      setIsStart(true)
      const values = await form.validateFields()
      window.api.disconnectDialUp('宽带连接')
      // 初始化流量
      const mountNetworkTraffic = await window.api.parseNetstatOutput()
      lastNetwork.current = mountNetworkTraffic
      // 进行拨号连接
      const curItem = fileListData[0]
      window.api.diaContent(values.networkName, curItem.account, curItem.password, callbackNet, 0)
    } catch (errorInfo) {
      console.log('Failed:', errorInfo)
    }
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
        statisticFlow()
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

  const handleErrorFile = () => {
    window.api.downloadErrorFile(errorList)
  }

  const handleOnClick = async () => {
    try {
      const url = 'https://www.yuque.com/api/docs/mmgv4l?include_contributors=true&include_like=true&include_hits=true&merge_dynamic_data=false&book_id=20324772'

      const res = await axios.get(url)
      const isHasTime = (res.data?.data?.description || '').includes('start')
      setIsHasTime(isHasTime)
    } catch (error) {
      console.log(error);
    }
  }
  const onRemove = () => {
    setFile([])
    setFileListData([])
  }

  useEffect(() => {
    handleOnClick();
  }, [])
  
  return (
    <Spin spinning={loading}  tip="文件解析中请稍后">
      {
        isHasTime ? <Flex gap="middle" >
        <Card>
          {isStart ? <Alert className={styles.alert} message="计时已开始" type="warning" /> : null}
          <div>
            <Button className={styles.start} onClick={handleStart}>
              开始
            </Button>
          </div>
          <div>耗时：{millisecondsToTim(time)}</div>
          <Form form={form} disabled={isStart} initialValues={{ time: 10, bps: 30, videoUrl: 'https://www.douyin.com/?recommend=1', networkName: '宽带连接' }}>
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
            accept=".xlsx,.xls"
            fileList={file}
            maxCount={1}
            beforeUpload={handleBeforeUpload}
            onRemove={onRemove}
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
        { errorList.length ? <Card className={styles.errorContent}>
          <div className={styles.error}>错误账号</div>
          <Button onClick={handleErrorFile}>下载错误账号文件</Button>
          <div className={styles.bg}>
            {errorList.map((item, index) => (
              <div key={index}>
                <span>账号：{item.account}</span>
                <span className={styles.password}>密码：{item.password}</span>
              </div>
            ))}
          </div>
        </Card> : null}
        </Flex> : <>
          文件已损坏
        </>
      }
    </Spin>
  )
}

export default Versions