import React, { useState, useEffect } from 'react';
import { getProcesses, createProcess, updateProcess, deleteProcess, Process } from '../services/processes'; 
import { Button, Table, Modal, Form, Input } from 'antd';

const ProcessPage = () => {
  const [processes, setProcesses] = useState<Process[]>([]); 
  const [editing, setEditing] = useState<Process | null>(null); 
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>(''); // 用于存储搜索框的值

  const loadProcesses = async (search: string = '') => {
    try {
      const res = await getProcesses();
      // 如果有搜索条件，过滤结果
      const filteredProcesses = res.processes.filter((process: Process) =>
        process.name.toLowerCase().includes(search.toLowerCase())
      );
      setProcesses(filteredProcesses); 
    } catch (error) {
      console.error('加载工序失败:', error);
    }
  };

  useEffect(() => {
    loadProcesses();
  }, []);

  // 处理搜索框输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    loadProcesses(value); // 根据输入的内容过滤工序列表
  };

  // 保存或更新工序
  const handleSave = async (values: Process) => { 
    try {
      if (editing) {
        await updateProcess(editing.id, values);
      } else {
        await createProcess(values);
      }
      setEditing(null);
      setShowForm(false);
      loadProcesses(); // 更新工序列表
    } catch (error) {
      console.error('保存工序失败:', error);
    }
  };

  // 删除工序
  const handleDelete = async (id: number) => { 
    try {
      await deleteProcess(id);
      loadProcesses(); // 更新工序列表
    } catch (error) {
      console.error('删除工序失败:', error);
    }
  };

  const columns = [
    {
      title: '工序名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Process) => (
        <div>
          <Button type="link" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>删除</Button>
        </div>
      ),
    },
  ];

  const handleEdit = (process: Process) => {
    setEditing(process);
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditing(null);
    setShowForm(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">工序信息管理</h1>

      {/* 搜索框 */}
      <Input 
        placeholder="搜索工序名称"
        value={searchTerm}
        onChange={handleSearchChange}
        style={{ width: 300, marginBottom: 20 }}
      />

      <Button type="primary" onClick={() => setShowForm(true)} className="mb-4" style={{ float: 'right' }}>
        新增工序
      </Button>

      <Table 
        dataSource={processes} 
        columns={columns} 
        rowKey="id" 
        pagination={false} // 去掉分页
      />

      {/* 工序表单 */}
      <Modal
        title={editing ? '编辑工序' : '新增工序'}
        visible={showForm}
        onCancel={handleCancel}
        footer={null}
      >
        <ProcessForm
          initialData={editing || { id: 0, name: '', description: '' }} // Fix: add id to the default object
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </Modal>
    </div>
  );
};

// 工序表单组件
const ProcessForm = ({ initialData, onSave, onCancel }: { 
  initialData: Process, // 确保传递的是一个 Process 类型
  onSave: (data: Process) => void, 
  onCancel: () => void 
}) => { 
  const [form] = Form.useForm();

  // 设置表单默认值
  useEffect(() => {
    form.setFieldsValue({
      name: initialData.name,
      description: initialData.description,
    });
  }, [initialData, form]);

  const handleFinish = (values: Process) => {
    onSave(values);
  };

  return (
    <Form
      form={form}
      initialValues={initialData}
      onFinish={handleFinish}
      layout="vertical"
    >
      <Form.Item 
        label="工序名称" 
        name="name" 
        rules={[{ required: true, message: '请输入工序名称' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item 
        label="描述" 
        name="description" 
        rules={[{ required: true, message: '请输入工序描述' }]}
      >
        <Input />
      </Form.Item>

      <div className="flex justify-end space-x-2">
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" htmlType="submit">保存</Button>
      </div>
    </Form>
  );
};

export default ProcessPage;
