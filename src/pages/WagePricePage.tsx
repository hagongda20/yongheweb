import React, { useState, useEffect, useCallback } from 'react';
import { getProcesses, Process } from '../services/processes';
import { getSpecModels } from '../services/specModel';
import { createWagePrice, getWagePrices, updateWagePrice, deleteWagePrice, WagePrice } from '../services/wagePrices';
import { Button, Select, Input, Checkbox, Form, notification, Table, Space, Popconfirm, Modal } from 'antd';

const { Option } = Select;
const { Search } = Input;

const WagePricePage = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [allSpecModels, setAllSpecModels] = useState<any[]>([]); // 所有规格型号
  const [specModels, setSpecModels] = useState<any[]>([]); // 当前选中工序下的规格型号
  const [wagePrices, setWagePrices] = useState<WagePrice[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [selectedSpecModelId, setSelectedSpecModelId] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [isSpecial, setIsSpecial] = useState(false);
  const [editingWagePrice, setEditingWagePrice] = useState<WagePrice | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchProcessValue, setSearchProcessValue] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      await loadProcesses(); // 等工序加载完成
      await loadAllSpecModels(); // 再加载所有规格型号
      await loadWagePrices(); // 最后加载工价
    };
  
    fetchData();
  }, []);
  

  const loadProcesses = useCallback(async () => {
    try {
      const res = await getProcesses();
      setProcesses(res.processes);
    } catch (error) {
      console.error('加载工序失败:', error);
    }
  }, []);

  const loadAllSpecModels = useCallback(async () => {
    try {
      const res = await getSpecModels(); // 不传process_id时返回所有规格型号
      setAllSpecModels(res.specModels);
      //console.log(res.specModels);
    } catch (error) {
      console.error('加载规格型号失败:', error);
    }
  }, []);

  const loadWagePrices = useCallback(async () => {
    try {
      const res = await getWagePrices();
      const specModels = await getSpecModels(); // 这里直接重新拿一遍，确保有数据
      const updatedWagePrices = res.wage_prices.map((wagePrice: WagePrice) => {
        const specModel = specModels.specModels.find((s: any) => s.id === wagePrice.spec_model_id);
        return {
          ...wagePrice,
          spec_model_name: specModel ? specModel.name : '未设置',
        };
      });
      setWagePrices(updatedWagePrices);
    } catch (error) {
      console.error('加载工价列表失败:', error);
    }
  }, []);
  

  const handleProcessChange = (processId: number) => {
    setSelectedProcessId(processId);
    setSelectedSpecModelId(null);
    const filteredSpecModels = allSpecModels.filter((s) => s.process_id === processId);
    setSpecModels(filteredSpecModels);
  };

  const handleSubmit = async () => {
    if (!selectedProcessId || !selectedSpecModelId || !price) {
      notification.error({
        message: '提示',
        description: '请选择工序、规格型号并填写价格',
      });
      return;
    }

    const data: Omit<WagePrice, 'id'> = {
      price: parseFloat(price),
      is_special: isSpecial,
      process_id: selectedProcessId,
      spec_model_id: selectedSpecModelId,
    };

    try {
      if (editingWagePrice) {
        await updateWagePrice(editingWagePrice.id, data);
        notification.success({
          message: '成功',
          description: '工价更新成功',
        });
      } else {
        await createWagePrice(data);
        notification.success({
          message: '成功',
          description: '工价设置成功',
        });
      }
      await loadWagePrices();
      resetForm();
    } catch (error) {
      console.error('保存工价失败:', error);
      notification.error({
        message: '错误',
        description: '保存工价失败，请稍后重试',
      });
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingWagePrice(null);
    setSelectedProcessId(null);
    setSelectedSpecModelId(null);
    setSpecModels([]);
    setPrice('');
    setIsSpecial(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWagePrice(id);
      notification.success({
        message: '成功',
        description: '工价删除成功',
      });
      await loadWagePrices();
    } catch (error) {
      console.error('删除工价失败:', error);
      notification.error({
        message: '错误',
        description: '删除工价失败，请稍后重试',
      });
    }
  };

  const getProcessName = (processId: number) => {
    const process = processes.find((p) => p.id === processId);
    return process ? process.name : '';
  };

  const columns = [
    {
      title: '工序',
      dataIndex: 'process_name',
      key: 'process_name',
      render: (_: any, record: WagePrice) => getProcessName(record.process_id),
    },
    {
      title: '规格型号',
      dataIndex: 'spec_model_name',
      key: 'spec_model_name',
    },
    {
      title: '工价',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: '是否特殊工价',
      dataIndex: 'is_special',
      key: 'is_special',
      render: (text: boolean) => (text ? '是' : '否'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WagePrice) => (
        <Space size="middle">
          <Button onClick={() => {
            setEditingWagePrice(record);
            setSelectedProcessId(record.process_id);
            setSelectedSpecModelId(record.spec_model_id);
            setPrice(record.price.toString());
            setIsSpecial(record.is_special);
            setShowModal(true);

            const filteredSpecModels = allSpecModels.filter((s) => s.process_id === record.process_id);
            setSpecModels(filteredSpecModels);
          }}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setSearchProcessValue(value);
  };

  const filteredWagePrices = wagePrices.filter((wagePrice) => {
    const processName = getProcessName(wagePrice.process_id);
    return processName.toLowerCase().includes(searchProcessValue.toLowerCase());
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">工价设置</h1>

      <div className="flex items-center mb-4 justify-between">
        <Search
          placeholder="按工序名称搜索"
          onSearch={handleSearch}
          style={{ width: 300, marginBottom: 20 }}
          allowClear
        />
        <Button
          type="primary"
          onClick={() => setShowModal(true)}
          style={{ float: 'right' }}
        >
          新增工价
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredWagePrices}
        rowKey="id"
        pagination={false} // 去掉分页
      />

      <Modal
        title={editingWagePrice ? '编辑工价' : '新增工价'}
        visible={showModal}
        onCancel={resetForm}
        onOk={handleSubmit}
        destroyOnClose
        width={600}
      >
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="选择工序" required>
            <Select
              value={selectedProcessId ?? undefined}
              onChange={handleProcessChange}
              placeholder="请选择工序"
              style={{ width: '100%' }}
            >
              {processes.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="选择规格型号" required>
            <Select
              value={selectedSpecModelId ?? undefined}
              onChange={(value) => setSelectedSpecModelId(value)}
              placeholder="请选择规格型号"
              style={{ width: '100%' }}
              disabled={!selectedProcessId}
            >
              {specModels.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="工价" required>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="请输入工价"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Checkbox
              checked={isSpecial}
              onChange={() => setIsSpecial((prev) => !prev)}
            >
              是否为特殊工价
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WagePricePage;
