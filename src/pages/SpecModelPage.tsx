import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Select, Modal, Table } from 'antd';
import { getSpecModels, createSpecModel, updateSpecModel, deleteSpecModel, SpecModel } from '../services/specModel';
import { getProcesses } from '../services/processes';

const { Option } = Select;
const { Search } = Input;

const SpecModelPage: React.FC = () => {
  const [specModels, setSpecModels] = useState<SpecModel[]>([]);
  const [processes, setProcesses] = useState<{ id: number; name: string }[]>([]);
  const [editing, setEditing] = useState<SpecModel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadSpecModels();
    loadProcesses();
  }, []);

  const loadSpecModels = async () => {
    setLoading(true);
    try {
      const res = await getSpecModels();
      setSpecModels(res.specModels);
    } catch (error) {
      console.error('加载规格型号失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProcesses = async () => {
    try {
      const res = await getProcesses();
      setProcesses(res.processes);
    } catch (error) {
      console.error('加载工序失败:', error);
    }
  };

  const handleSave = async (data: SpecModel) => {
    try {
      if (editing) {
        await updateSpecModel(editing.id, data);
      } else {
        await createSpecModel(data);
      }
      setEditing(null);
      setShowForm(false);
      loadSpecModels();
    } catch (error) {
      console.error('保存规格型号失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSpecModel(id);
      loadSpecModels(); // 更新规格型号列表
    } catch (error) {
      console.error('删除规格型号失败:', error);
    }
  };
  
  
  

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleCancel = () => {
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (spec: SpecModel) => {
    setEditing(spec);
    setShowForm(true);
  };

  const filteredSpecModels = specModels.filter((spec) => {
    const process = processes.find((p) => p.id === spec.process_id);
    return process ? process.name.includes(searchValue) : false;
  });

  const columns = [
    {
      title: '规格名称',
      dataIndex: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category',
    },
    {
      title: '价格',
      dataIndex: 'price',
    },
    {
      title: '工序',
      dataIndex: 'process_id',
      render: (processId: number) => {
        const process = processes.find((p) => p.id === processId);
        return process ? process.name : '-';
      },
    },
    {
      title: '操作',
      render: (_: any, spec: SpecModel) => (
        <div>
          <Button type="link" onClick={() => handleEdit(spec)}>
            编辑
          </Button>
          <Button type="link" danger onClick={() => handleDelete(spec.id)}>
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">规格型号管理</h1>

      <div className="flex items-center mb-4 space-x-4">
        <Search
          placeholder="按工序名称搜索"
          onSearch={handleSearch}
          style={{ width: 300, marginBottom: 20 }}
          allowClear
        />
        <Button type="primary" onClick={() => setShowForm(true)} style={{ float: 'right' }}>
          新增规格型号
        </Button>
      </div>

      <Table
        dataSource={filteredSpecModels}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={false}  // 👈 加上这一行，禁用分页
      />

      <Modal
        open={showForm}
        title={editing ? '编辑规格型号' : '新增规格型号'}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        width={600}
      >
        <SpecModelForm
          initialData={editing || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
          processes={processes}
        />
      </Modal>
    </div>
  );
};

interface SpecModelFormProps {
  initialData?: SpecModel;
  onSave: (data: SpecModel) => void;
  onCancel: () => void;
  processes: { id: number; name: string }[];
}

const SpecModelForm: React.FC<SpecModelFormProps> = ({ initialData, onSave, onCancel, processes }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    const data: SpecModel = {
      id: initialData?.id || 0,
      name: values.name,
      category: values.category,
      price:values.price,
      process_id: Number(values.process_id),
    };
    onSave(data);
  };

  return (
    <Form
      form={form}
      initialValues={{
        name: initialData?.name || '',
        category: initialData?.category || '',
        process_id: initialData?.process_id || '',
      }}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Form.Item
        name="process_id"
        label="选择工序"
        rules={[{ required: true, message: '请选择工序！' }]}
      >
        <Select placeholder="请选择工序">
          {processes.map((process) => (
            <Option key={process.id} value={process.id}>
              {process.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="name"
        label="规格名称"
        rules={[{ required: true, message: '请输入规格名称！' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="category"
        label="分类"
        rules={[{ required: true, message: '请输入分类！' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        
        name="price"
        label="工价"
        rules={[{ required: true, message: '请输入工价！' }]}
      >
        <Input type="number"/>
      </Form.Item>

      <div className="text-right">
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          取消
        </Button>
        <Button type="primary" htmlType="submit">
          保存
        </Button>
      </div>
    </Form>
  );
};

export default SpecModelPage;
