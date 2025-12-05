import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
  Table,
  Card,
  Space,
  Tag,
  Modal,
  DatePicker,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import type { RangePickerProps } from "antd/es/date-picker";

interface OptionItem {
  value: number | string;
  label: string;
}

interface TransactionItem {
  id: number;
  company_id: number;
  customer_id: number;
  company_account_id: number;
  customer_account_id?: number;
  amount: number;
  direction: string;
  method: string;
  reference_no: string;
  remark: string;
  created_at: string;
  updated_at?: string;
}

const { RangePicker } = DatePicker;

const TransactionPage: React.FC = () => {
  const [form] = Form.useForm();
  const [queryForm] = Form.useForm();

  const [companies, setCompanies] = useState<OptionItem[]>([]);
  const [customers, setCustomers] = useState<OptionItem[]>([]);
  const [companyAccounts, setCompanyAccounts] = useState<OptionItem[]>([]);
  const [customerAccounts, setCustomerAccounts] = useState<OptionItem[]>([]);

  const [list, setList] = useState<TransactionItem[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadInitData();
    loadList();
  }, []);

  /** 初始化下拉 */
  const loadInitData = async () => {
    const companyRes = await axios.get("/api/company/list");
    setCompanies(companyRes.data.data.map((c: any) => ({ value: c.id, label: c.name })));

    const customerRes = await axios.get("/api/customer/");
    setCustomers(customerRes.data.items.map((c: any) => ({ value: c.id, label: c.name })));

    const companyAccountRes = await axios.get("/api/company_account/list");
    setCompanyAccounts(
      companyAccountRes.data.data.items.map((c: any) => ({ value: c.id, label: c.account_name }))
    );

    const customerAccountRes = await axios.get("/api/customer_account/list");
    setCustomerAccounts(
      customerAccountRes.data.data.map((c: any) => ({ value: c.id, label: c.account_no }))
    );
  };

  /** 查询列表 */
  const loadList = async () => {
    const query = queryForm.getFieldsValue();
    // 处理时间范围
    if (query.dateRange) {
      query.start_date = query.dateRange[0].format("YYYY-MM-DD");
      query.end_date = query.dateRange[1].format("YYYY-MM-DD");
    }
    const res = await axios.get("/api/transaction/list", { params: query });
    setList(res.data.data || []);
  };

  /** 点击新增 */
  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  /** 点击编辑 */
  const handleEdit = (record: TransactionItem) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  /** 删除 */
  const handleDelete = async (record: TransactionItem) => {
    const ok = window.confirm(`确认删除流水 ID: ${record.id} 吗？删除后不可恢复`);
    if (!ok) return;

    try {
        await axios.delete(`/api/transaction/delete/${record.id}`);
        message.success("删除成功");
        loadList(); // 刷新列表
    } catch (e) {
        message.error("删除失败");
    }
  };

  /** 提交新增/编辑 */
  const onFinish = async (values: any) => {
    try {
      if (editingId) {
        await axios.put(`/api/transaction/update/${editingId}`, values);
        message.success("编辑成功");
      } else {
        await axios.post("/api/transaction/add", values);
        message.success("新增成功");
      }
      setModalVisible(false);
      form.resetFields();
      loadList();
    } catch (e) {
      message.error("操作失败");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    {
      title: "公司",
      dataIndex: "company_id",
      render: (id: number) => {
        const item = companies.find((c) => c.value === id);
        return item ? item.label : "-";
      },
    },
    {
      title: "客户",
      dataIndex: "customer_id",
      render: (id: number) => {
        //console.log('客户基础数据：', customers, 'id:', id);
        const item = customers.find((c) => c.value === id);
        return item ? item.label : "-";
      },
    },
    {
      title: "账号",
      dataIndex: "customer_account_id",
      render: (id: number) => {
        //console.log('客户账号下拉数据：', customerAccounts, 'id:', id);
        const item = customerAccounts.find((c) => c.value === id);
        return item ? item.label : "-";
      },
    },
    { title: "金额", dataIndex: "amount" },
    {
      title: "方向",
      dataIndex: "direction",
      render: (v: string) =>
        v === "income" ? (
          <Tag color="green">收入</Tag>
        ) : (
          <Tag color="red">支出</Tag>
        ),
    },
    {
      title: "方式",
      dataIndex: "method",
      render: (v: string) =>
        ({
          bank: "银行",
          wechat: "微信",
          alipay: "支付宝",
          other: "其他",
        } as any)[v] || v,
    },
    { title: "交易号", dataIndex: "reference_no" },
    { title: "备注", dataIndex: "remark" },
    {
      title: "创建时间",
      dataIndex: "created_at",
      render: (v: string) => v || "-",
    },
    {
      title: "更新时间",
      dataIndex: "updated_at",
      render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : "-"),
    },
    {
      title: "操作",
      render: (_: any, record: TransactionItem) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 查询区域 */}
      <Card style={{ marginBottom: 20 }}>
        <Form form={queryForm} layout="inline">
          <Form.Item name="company_id" label="公司">
            <Select placeholder="请选择公司" allowClear style={{ width: 180 }}>
              {companies.map((i) => (
                <Select.Option key={i.value} value={i.value}>
                  {i.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="customer_id" label="客户">
            <Select placeholder="请选择客户" allowClear style={{ width: 180 }}>
              {customers.map((i) => (
                <Select.Option key={i.value} value={i.value}>
                  {i.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label="时间范围">
            <RangePicker />
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={loadList}>
              查询
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={() => queryForm.resetFields()}>重置</Button>
          </Form.Item>
          <Form.Item>
            <Button type="primary" ghost onClick={handleCreate}>
              新增流水
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 表格 */}
      <Card title="转账流水列表">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={list}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 弹窗 */}
      <Modal
        title={editingId ? "编辑流水" : "新增流水"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Space wrap size={20}>
            <Form.Item name="company_id" label="所属公司" rules={[{ required: true }]}>
              <Select placeholder="请选择公司" style={{ width: 220 }}>
                {companies.map((i) => (
                  <Select.Option key={i.value} value={i.value}>
                    {i.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="customer_id" label="客户" rules={[{ required: true }]}>
              <Select placeholder="请选择客户" style={{ width: 220 }}>
                {customers.map((i) => (
                  <Select.Option key={i.value} value={i.value}>
                    {i.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="customer_account_id" label="客户账户">
              <Select allowClear placeholder="选择客户账户" style={{ width: 220 }}>
                {customerAccounts.map((i) => (
                  <Select.Option key={i.value} value={i.value}>
                    {i.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="company_account_id" label="公司账户" rules={[{ required: true }]}>
              <Select placeholder="请选择公司账户" style={{ width: 220 }}>
                {companyAccounts.map((i) => (
                  <Select.Option key={i.value} value={i.value}>
                    {i.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
              <InputNumber min={0.01} step={0.01} style={{ width: 220 }} />
            </Form.Item>

            <Form.Item name="direction" label="方向" rules={[{ required: true }]}>
              <Select style={{ width: 220 }}>
                <Select.Option value="income">收入</Select.Option>
                <Select.Option value="expense">支出</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="method" label="支付方式" rules={[{ required: true }]}>
              <Select style={{ width: 220 }}>
                <Select.Option value="bank">银行</Select.Option>
                <Select.Option value="wechat">微信</Select.Option>
                <Select.Option value="alipay">支付宝</Select.Option>
                <Select.Option value="other">其他</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="reference_no" label="交易号">
              <Input style={{ width: 220 }} />
            </Form.Item>

            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} style={{ width: 220 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default TransactionPage;
