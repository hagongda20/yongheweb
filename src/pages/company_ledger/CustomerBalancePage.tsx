// src/pages/CustomerBalancePage.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message } from 'antd';
import axios from 'axios';

const { Option } = Select;

interface CustomerBalance {
  id: number;
  customer_id: number;
  company_id: number;
  balance: number;
  adjustment_total: number;
  remark?: string;

  customer_name?: string; // 后端附带
  company_name?: string;  // 后端附带
}

interface Customer {
  id: number;
  name: string;
}

interface Company {
  id: number;
  name: string;
}

const CustomerBalancePage: React.FC = () => {
  const [items, setItems] = useState<CustomerBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  const [searchCustomer, setSearchCustomer] = useState<number | undefined>();
  const [searchCompany, setSearchCompany] = useState<number | undefined>();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomerBalance | null>(null);

  const [form] = Form.useForm();

  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [companyList, setCompanyList] = useState<Company[]>([]);

  // ----------------------
  // 获取客户、公司下拉数据
  // ----------------------
  const fetchBaseData = async () => {
    try {
        const res = await axios.get('/api/customer_balance/options');
        const data = res.data?.data || {};
        setCustomerList(data.customers || []);
        setCompanyList(data.companies || []);
    } catch (err) {
        message.error('获取客户/公司下拉数据失败');
    }
    };

  const fetchBalanceList = async () => {
    setLoading(true);
    try {
        const res = await axios.get('/api/customer_balance/list', {
        params: {
            page,
            per_page: perPage,
            customer_id: searchCustomer,
            company_id: searchCompany,
        }
        });

        const { items, total } = res.data.data;

        setItems(items);
        setTotal(total);
    } catch (err: any) {
        message.error(err.response?.data?.error || '获取余额列表失败');
    }
    setLoading(false);
    };


  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    fetchBalanceList();
  }, [page, perPage, searchCustomer, searchCompany]);

  // ----------------------
  // 新增/编辑
  // ----------------------
  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: CustomerBalance) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await axios.put(`/api/customer_balance/update/${editingItem.id}`, values);
        message.success("更新成功");
      } else {
        await axios.post('/api/customer_balance/add', values);
        message.success("新增成功");
      }
      setModalVisible(false);
      fetchBalanceList();
    } catch (err: any) {
      message.error(err.response?.data?.error || "操作失败");
    }
  };

  // ----------------------
  // 表格列
  // ----------------------
  const columns = [
    {
        title: "序号",
        width: 60,
        //align: "center",
        dataIndex: "__index", // 虚拟字段，用不到但 TS 必须有
        render: (_: any, __: any, index: number) => index + 1,
    },
    //{ title: "ID", dataIndex: "id", width: 80 },
    { title: "客户", dataIndex: "customer_name" },
    { title: "公司", dataIndex: "company_name" },
    { title: "余额", dataIndex: "balance" },
    { title: "累计抹零/勾账", dataIndex: "adjustment_total" },
    { title: "备注", dataIndex: "remark" },
    {
      title: "操作",
      render: (_: any, record: CustomerBalance) => (
        <Button type="link" onClick={() => handleEdit(record)}>编辑</Button>
      ),
    },
  ];

  return (
    <div>
      {/* 搜索 */}
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="按客户过滤"
          style={{ width: 200, marginRight: 8 }}
          allowClear
          value={searchCustomer}
          onChange={v => setSearchCustomer(v)}
        >
          {customerList.map(c => (
            <Option key={c.id} value={c.id}>{c.name}</Option>
          ))}
        </Select>

        <Select
          placeholder="按公司过滤"
          style={{ width: 200, marginRight: 8 }}
          allowClear
          value={searchCompany}
          onChange={v => setSearchCompany(v)}
        >
          {companyList.map(c => (
            <Option key={c.id} value={c.id}>{c.name}</Option>
          ))}
        </Select>

        <Button type="primary" onClick={fetchBalanceList}>搜索</Button>
        <Button onClick={handleAdd} style={{ marginLeft: 8 }}>新增余额</Button>
      </div>

      {/* 表格 */}
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{
          current: page,
          pageSize: perPage,
          total,
          onChange: (p, ps) => {
            setPage(p);
            setPerPage(ps);
          }
        }}
      />

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingItem ? "编辑余额" : "新增余额"}
        visible={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="customer_id"
            label="客户"
            rules={[{ required: true, message: "请选择客户" }]}
          >
            <Select>
              {customerList.map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="company_id"
            label="公司"
            rules={[{ required: true, message: "请选择公司" }]}
          >
            <Select>
              {companyList.map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="balance" label="余额" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>

          <Form.Item name="adjustment_total" label="累计抹零/勾账" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerBalancePage;
