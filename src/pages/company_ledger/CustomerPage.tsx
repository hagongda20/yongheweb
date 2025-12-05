// src/pages/CustomerPage.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import axios from 'axios';

const { Option } = Select;

interface Customer {
  id: number;
  name: string;
  type: 'supplier' | 'sales' | 'other';
  phone?: string;
  company?: string;
  remark?: string;
}

const CustomerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(20);

  const [searchName, setSearchName] = useState('');
  const [searchType, setSearchType] = useState<string | undefined>();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [form] = Form.useForm();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/customer/', {
        params: {
          page,
          per_page: perPage,
          name: searchName,
          type: searchType,
        },
      });
      setCustomers(res.data.items);
      setTotal(res.data.total);
    } catch (err: any) {
      message.error(err.response?.data?.error || '获取客户列表失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, perPage, searchName, searchType]);

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/customer/${id}`);
      message.success('客户已删除');
      fetchCustomers();
    } catch (err: any) {
      message.error(err.response?.data?.error || '删除失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        await axios.put(`/api/customer/${editingCustomer.id}`, values);
        message.success('客户更新成功');
      } else {
        await axios.post('/api/customer/', values);
        message.success('客户创建成功');
      }
      setModalVisible(false);
      fetchCustomers();
    } catch (err: any) {
      message.error(err.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id' },
    { title: '名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type' },
    { title: '电话', dataIndex: 'phone' },
    { title: '单位', dataIndex: 'company' },
    { title: '备注', dataIndex: 'remark' },
    {
      title: '操作',
      render: (_: any, record: Customer) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认删除吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索客户名称"
          style={{ width: 200, marginRight: 8 }}
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
        />
        <Select
          placeholder="选择类型"
          style={{ width: 150, marginRight: 8 }}
          allowClear
          value={searchType}
          onChange={v => setSearchType(v)}
        >
          <Option value="supplier">供应商</Option>
          <Option value="sales">销售客户</Option>
          <Option value="other">其他</Option>
        </Select>
        <Button type="primary" onClick={fetchCustomers}>搜索</Button>
        <Button style={{ marginLeft: 8 }} onClick={handleAdd}>新增客户</Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={customers}
        loading={loading}
        pagination={{
          current: page,
          pageSize: perPage,
          total,
          onChange: (p, ps) => { setPage(p); setPerPage(ps); }
        }}
      />

      <Modal
        title={editingCustomer ? '编辑客户' : '新增客户'}
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择客户类型' }]}>
            <Select>
              <Option value="supplier">供应商</Option>
              <Option value="sales">销售客户</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="company" label="单位">
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerPage;
