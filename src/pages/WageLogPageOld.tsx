import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, Input, InputNumber, notification, DatePicker } from 'antd';
import { getWorkers } from '../services/workers';
import { getProcesses } from '../services/processes';
import { getSpecModelsByProcess, getSpecModels } from '../services/specModel';
import { getWagePriceByProcessAndSpec } from '../services/wagePrices';
import { createWageLog, updateWageLog, deleteWageLog, getWageLogs, getWageLogById } from '../services/wageLogs';
import dayjs from 'dayjs'

const { Option } = Select;

// 类型定义
interface Worker {
  id: number;
  name: string;
  process_id: number;
  process_name: string;
}

interface Process {
  id: number;
  name: string;
}

interface SpecModel {
  id: number;
  name: string;
  actual_price: number;
}

interface WageLog {
  id?: number;
  worker_id: number;
  process_id: number;
  spec_model_id: number;
  actual_price: number;
  quantity: number;
  total_wage: number;
  remark: string;
  date: string;
  created_at: string;
  updated_at: string;
}

// 页面组件
const WageLogPage = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [wageLogs, setWageLogs] = useState<WageLog[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState<WageLog | null>(null);
  const [form] = Form.useForm();
  const [specModels, setSpecModels] = useState<SpecModel[]>([]);
  const [allSpecModels, setAllSpecModels] = useState<SpecModel[]>([]);
  const [searchDate, setSearchDate] = useState<string | null>(null);

  const [searchWorker, setSearchWorker] = useState('');
  const [searchProcess, setSearchProcess] = useState('');

  // 加载工人
  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const res = await getWorkers();
        const workersWithProcessName = res.data.workers.map((w: any) => ({
          ...w,
          process_name: w.process.name || '',
        }));
        //console.log(res.data.workers);
        setWorkers(workersWithProcessName);
      } catch (error) {
        console.error('加载工人失败:', error);
      }
    };
    loadWorkers();
  }, []);

  // 加载工序
  useEffect(() => {
    const loadProcesses = async () => {
      try {
        const res = await getProcesses();
        setProcesses(res.processes);
      } catch (error) {
        console.error('加载工序失败:', error);
      }
    };
    loadProcesses();
  }, []);

  //加载所有规格
  useEffect(() => {
    const loadAllSpecModels = async () => {
      const res = await getSpecModels();
      //console.log("工资记录：", res);
      setAllSpecModels(res.specModels);
    };
    loadAllSpecModels();
  }, []);

  // 加载工资记录
  useEffect(() => {
      //加载工资记录
    const loadWageLog = async () => {
      const res = await getWageLogs();
      console.log("工资记录：", res);
      setWageLogs(res.wage_logs);
    };
    loadWageLog();
  }, []);


  // 打开新增/编辑弹窗
  const openModal = (log?: WageLog) => {
    if (log) {
      // 编辑模式
      setEditingLog(log);
      form.setFieldsValue({
        ...log,
        date: dayjs(log.date), // 确保是 moment 对象
      });
      loadSpecModels(log.process_id);
    } else {
      // 新增模式
      setEditingLog(null);
      form.resetFields();
      form.setFieldsValue({ date: dayjs() }); // ✅ 只有在新增时才手动设为今天
    }
    setModalVisible(true);
  };
  
  

  // 保存

  const saveWageLog = async () => {
    try {
      const values = await form.validateFields();
      const specModel = specModels.find(sm => sm.id === values.spec_model_id);

      values.date = values.date.format('YYYY-MM-DD');

      const actualPrice = values.actual_price ?? specModel?.actual_price ?? 0;
      const quantity = values.quantity ?? 0;

      const newLog: WageLog = {
        ...values,
        actual_price: actualPrice,
        total_wage: actualPrice * quantity,
      };
      console.log('newLog:', newLog);

      if (editingLog) {
        await updateWageLog(editingLog.id!, { ...newLog, id: editingLog.id! });
        const curWageLog = await getWageLogById(editingLog.id!);
        setWageLogs(prev =>
          prev.map(item => (item.id === editingLog.id ? curWageLog : item))
        );
        notification.success({ message: '编辑成功' });
      } else {
        const res = await createWageLog(newLog);
        const curWageLog = await getWageLogById(res.id);
        setWageLogs(prev => [...prev, curWageLog]);
        notification.success({ message: '新增成功' });
      }

      setModalVisible(false);
    } catch (error) {
      console.error(error);
      notification.error({ message: '保存失败' });
    }
  };


  // 删除
  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      await deleteWageLog(id);
      setWageLogs(prev => prev.filter(item => item.id !== id));
      notification.success({ message: '删除成功' });
    } catch (error) {
      console.error(error);
      notification.error({ message: '删除失败' });
    }
  };

  // 加载规格型号
  const loadSpecModels = async (processId: number) => {
    if (!processId) return;
    try {
      const res = await getSpecModelsByProcess(processId);
      //console.log('res.spec_models:',res.spec_models);
      setSpecModels(res.spec_models);
    } catch (error) {
      console.error('加载规格型号失败:', error);
    }
  };

  

  const columns = [
    {
      title: '工人',
      dataIndex: 'worker_id',
      render: (worker_id: number) => workers.find(w => w.id === worker_id)?.name || '',
    },
    {
      title: '工序',
      dataIndex: 'process_id',
      render: (process_id: number) => processes.find(p => p.id === process_id)?.name || '',
    },
    {
      title: '规格型号',
      dataIndex: 'spec_model_id',
      render: (spec_model_id: number) => allSpecModels.find(s => s.id === spec_model_id)?.name || '',
    },
    {
      title: '工价',
      dataIndex: 'actual_price',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
    },
    {
      title: '总额',
      dataIndex: 'total_wage',
    },
    {
      title: '工资日期',
      dataIndex: 'date',
    },
    {
      title: '更新日期',
      dataIndex: 'updated_at',
    },
    {
      title: '备注',
      dataIndex: 'remark',
    },
    {
      title: '操作',
      render: (_: any, record: WageLog) => (
        <>
          <Button type="link" onClick={() => openModal(record)}>编辑</Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>删除</Button>
        </>
      ),
    },
  ];

  // 加载工价
  const loadWagePrice = async (process_id: any, specModelId: any) => {
    console.log('specModelId:',specModelId);
    if (!specModelId) return;
    try {
      console.log('开始调用工价查询:');
      const res = await getWagePriceByProcessAndSpec(process_id, specModelId);
      console.log('res.wage_price:',res);
      //form.setFieldsValue({ spec_model_id: undefined, actual_price: 0 });
      form.setFieldsValue({ actual_price:res.wage_price });
    } catch (error) {
      console.error('加载规格型号失败:', error);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索工人"
          onSearch={setSearchWorker}
          style={{ width: 200, marginRight: 16 }}
        />
        <Input.Search
          placeholder="搜索工序"
          onSearch={setSearchProcess}
          style={{ width: 200 }}
        />
        <DatePicker
          placeholder="选择日期"
          onChange={(date) => {
            // 传递格式化后的字符串或原始 Dayjs 对象都可以，取决于你后台或筛选逻辑
            setSearchDate(date ? date.format('YYYY-MM-DD') : null);
          }}
          style={{ marginRight: 16 }}
        />
        
        <Button type="primary" style={{ marginLeft: 16 }} onClick={() => openModal()}>
          新增工资记录
        </Button>
      </div>

      <Table
        dataSource={wageLogs.filter(log => {
          const worker = workers.find(w => w.id === log.worker_id);
          const process = processes.find(p => p.id === log.process_id);
          const matchWorker = !searchWorker || worker?.name.includes(searchWorker);
          const matchProcess = !searchProcess || process?.name.includes(searchProcess);
          const matchDate = !searchDate || dayjs(log.date).format('YYYY-MM-DD') === searchDate;
          return matchWorker && matchProcess && matchDate;
        })}
        columns={columns}
        rowKey="id"
      />

      <Modal
        title={editingLog ? '编辑工资记录' : '新增工资记录'}
        open={modalVisible}
        onOk={saveWageLog}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="worker_id" label="工人" rules={[{ required: true }]}>
            <Select placeholder="请选择工人">
              {workers.map(w => (
                <Option key={w.id} value={w.id}>
                  {w.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="process_id" label="工序" rules={[{ required: true }]}>
            <Select
              placeholder="请选择工序"
              onChange={(value) => {
                form.setFieldsValue({ spec_model_id: undefined, actual_price: 0 });
                loadSpecModels(value);
              }}
            >
              {processes.map(p => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="spec_model_id" label="规格型号" rules={[{ required: true }]}>
            <Select
              placeholder="请选择规格型号"
              onChange={(value) => {
                //const specModel = specModels.find(sm => sm.id === value);
                const { process_id } = form.getFieldsValue(['process_id']);
                console.log('规格型号选择:', value, '对应工序:', process_id);
                if (process_id && value) {
                  loadWagePrice(process_id, value);
                } else {
                  console.warn('缺少 process_id 或 spec_model_id，无法加载工价');
                }
              }}
            >
              {specModels.map(s => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="actual_price" label="工价">
            <Input />
          </Form.Item>

          <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>

          <Form.Item shouldUpdate>
            {() => {
              const actual_price = form.getFieldValue('actual_price') || 0;
              const quantity = form.getFieldValue('quantity') || 0;
              return (
                <Form.Item label="总额">
                  <Input disabled value={actual_price * quantity} />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current > dayjs().endOf('day')} // 可选：限制不能选未来
              
                        
            />
          </Form.Item>


          <Form.Item name="remark" label="备注">
            <Input />
          </Form.Item>
        </Form>

      </Modal>
    </div>
  );
};

export default WageLogPage;   