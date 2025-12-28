import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm } from "antd";
import axios from "axios";

const { Option } = Select;

const CompanyAccountPage: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0 });

  const [filterCompanyId, setFilterCompanyId] = useState<number | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);

  const [form] = Form.useForm();

  /** 加载公司列表（下拉框） */
  const fetchCompanies = async () => {
    const res = await axios.get("/api/company_account/companies");
    if (res.data.success) {
      setCompanies(res.data.data);
    }
  };

  /** 加载公司账户分页数据 */
  const fetchAccounts = async (page = 1, company_id = filterCompanyId) => {
    setLoading(true);
    try {
      const res = await axios.get("/api/company_account/list", {
        params: { page, per_page: pagination.per_page, company_id }
      });

      if (res.data.success) {
        setAccounts(res.data.data.items);
        setPagination({
          ...pagination,
          page: res.data.data.page,
          total: res.data.data.total
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchAccounts();
  }, []);

  /** 切换公司筛选 */
  const handleCompanyFilter = (val: number | null) => {
    setFilterCompanyId(val);
    fetchAccounts(1, val);
  };

  /** 打开新增 */
  const openAdd = () => {
    setEditingAccount(null);
    form.resetFields();
    setModalVisible(true);
  };

  /** 打开编辑 */
  const openEdit = (record: any) => {
    setEditingAccount(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  /** 提交表单（新增/编辑） */
  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingAccount) {
        const res = await axios.put(`/api/company_account/update/${editingAccount.id}`, values);
        if (res.data.success) message.success("更新成功");
      } else {
        const res = await axios.post("/api/company_account/add", values);
        if (res.data.success) message.success("新增成功");
      }

      setModalVisible(false);
      fetchAccounts(pagination.page);
    } catch (err: any) {
      message.error(err.response?.data?.message || "操作失败");
    }
  };

  /** 删除 */
  const handleDelete = async (id: number) => {
    try {
      const res = await axios.delete(`/api/company_account/delete/${id}`);
      if (res.data.success) {
        message.success("删除成功");
        fetchAccounts();
      }
    } catch (err) {
      message.error("删除失败");
    }
  };

  /** 表格列 */
  const columns = [
    {
      title: "序号",
      width: 60,
      dataIndex: "__index",
      render: (_: any, __: any, index: number) => index + 1,
    },
    { title: "公司", dataIndex: "company_name" },
    { title: "账户名称", dataIndex: "account_name" },
    { title: "类型", dataIndex: "account_type" },
    { title: "账号", dataIndex: "account_no" },
    { title: "银行名称", dataIndex: "bank_name" },
    { title: "币种", dataIndex: "currency" },
    {
      title: "余额",
      dataIndex: "balance",
      render: (v: any) => Number(v).toFixed(2)
    },
    { title: "状态", dataIndex: "status" },
    { title: "备注", dataIndex: "remark" },
    {
      title: "操作",
      width: 150,
      render: (record: any) => (
        <>
          <Button type="link" onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </>
      )
    }
  ];

  /** TS 不报错的模糊搜索函数 */
  const companyFilterOption = (input: string, option?: any) => {
    let label = "";

    if (typeof option?.children === "string") {
      label = option.children;
    } else if (typeof option?.label === "string") {
      label = option.label;
    }

    return label.toLowerCase().includes(input.toLowerCase());
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>公司账户管理</h2>

      {/* 顶部公司搜索 */}
      <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <Select
          showSearch
          allowClear
          placeholder="请选择公司"
          style={{ width: 220 }}
          value={filterCompanyId}
          onChange={handleCompanyFilter}
          optionFilterProp="children"
          filterOption={companyFilterOption}
        >
          {companies.map(c => (
            <Option key={c.id} value={c.id}>{c.name}</Option>
          ))}
        </Select>

        <Button type="primary" onClick={openAdd}>
          新增账户
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={accounts}
        pagination={{
          current: pagination.page,
          total: pagination.total,
          pageSize: pagination.per_page,
          onChange: (page) => fetchAccounts(page)
        }}
      />

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingAccount ? "编辑账户" : "新增账户"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="保存"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="所属公司"
            name="company_id"
            rules={[{ required: true, message: "请选择公司" }]}
          >
            <Select placeholder="请选择公司">
              {companies.map((c: any) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="账户名称" name="account_name" rules={[{ required: true }]}>
            <Input placeholder="如：收款账户A" />
          </Form.Item>

          <Form.Item label="账户类型" name="account_type" rules={[{ required: true }]}>
            <Select>
              <Option value="银行">银行</Option>
              <Option value="微信">微信</Option>
              <Option value="现金">现金</Option>
              <Option value="支付宝">支付宝</Option>
              <Option value="其它">其它</Option>
            </Select>
          </Form.Item>

          <Form.Item label="账号" name="account_no" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="银行名称" name="bank_name">
            <Input placeholder="仅银行账户需要填写" />
          </Form.Item>

          <Form.Item label="币种" name="currency">
            <Input defaultValue="CNY" />
          </Form.Item>

          <Form.Item label="余额" name="balance">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item label="状态" name="status">
            <Select>
              <Option value="正常">正常</Option>
              <Option value="停用">停用</Option>
            </Select>
          </Form.Item>

          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CompanyAccountPage;
