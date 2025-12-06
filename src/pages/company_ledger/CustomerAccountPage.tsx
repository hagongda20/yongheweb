import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
} from "antd";
import axios from "axios";

const { Option } = Select;

/* ----------------------------------
   TS 类型
----------------------------------- */
interface Customer {
  id: number;
  name: string;
}

interface CustomerAccount {
  id: number;
  customer_id: number;
  customer_name: string;
  account_type: string;
  account_no?: string;
  bank_name?: string;
  remark?: string;
}

interface PageData<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

/* ----------------------------------
   主组件
----------------------------------- */
const CustomerAccountPage: React.FC = () => {
  const [list, setList] = useState<CustomerAccount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCustomerId, setSearchCustomerId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form] = Form.useForm();

  /* ----------------------------------
     获取客户（下拉框）
  ----------------------------------- */
  const fetchCustomers = async () => {
    try {
      const res = await axios.get("/api/customer/");
      const list = Array.isArray(res.data.items) ? res.data.items : [];
      setCustomers(list);
    } catch {
      message.error("获取客户列表失败");
    }
  };

  /* ----------------------------------
     获取支付账户（分页）
  ----------------------------------- */
  const fetchList = async (p = page) => {
    try {
      setLoading(true);
      const res = await axios.get("/api/customer_account/list", {
        params: {
          page: p,
          per_page: perPage,
          customer_id: searchCustomerId,
          //account_no: searchAccountNo,
        },
      });

      const data: PageData<CustomerAccount> = res.data.data;

      setList(data.items);
      setTotal(data.total);
      setPage(data.page);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchCustomers();
    fetchList(1);
  }, []);

  /* ----------------------------------
     新增
  ----------------------------------- */
  const openAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  /* ----------------------------------
     编辑
  ----------------------------------- */
  const openEdit = (record: CustomerAccount) => {
    setEditingId(record.id);

    form.setFieldsValue({
      customer_id: record.customer_id,
      account_type: record.account_type,
      account_no: record.account_no,
      bank_name: record.bank_name,
      remark: record.remark,
    });

    setModalVisible(true);
  };

  /* ----------------------------------
     删除
  ----------------------------------- */
  const deleteItem = async (id: number) => {
    try {
      await axios.delete(`/api/customer_account/delete/${id}`);
      message.success("删除成功");
      fetchList(page);
    } catch {
      message.error("删除失败");
    }
  };

  /* ----------------------------------
     保存
  ----------------------------------- */
  const onSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingId) {
        await axios.put(`/api/customer_account/update/${editingId}`, values);
        message.success("修改成功");
      } else {
        await axios.post(`/api/customer_account/add`, values);
        message.success("新增成功");
      }

      setModalVisible(false);
      fetchList(page);
    } catch (err) {
      console.log(err);
    }
  };

  /* ----------------------------------
     表格列
  ----------------------------------- */
  const columns = [
    {
        title: "序号",
        width: 60,
        //align: "center",
        dataIndex: "__index", // 虚拟字段，用不到但 TS 必须有
        render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "客户",
      dataIndex: "customer_name",
      width: 150,
    },
    {
      title: "账户类型",
      dataIndex: "account_type",
      width: 100,
    },
    { title: "账号", dataIndex: "account_no", width: 140 },
    { title: "银行名称", dataIndex: "bank_name", width: 120 },
    { title: "备注", dataIndex: "remark" },
    {
      title: "操作",
      width: 150,
      render: (_: any, record: CustomerAccount) => (
        <>
          <Button size="small" type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>

          <Popconfirm title="确认删除？" onConfirm={() => deleteItem(record.id)}>
            <Button size="small" type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>客户支付账户管理</h2>

    <div style={{ marginBottom: 16, display: "flex", gap: 10 }}>
      <Select
        showSearch
        allowClear
        placeholder="按客户查询"
        style={{ width: 180 }}
        value={searchCustomerId}
        onChange={(v) => setSearchCustomerId(v || null)}
        filterOption={(input, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase())
        }
        options={customers.map((c) => ({
          value: c.id,
          label: c.name,
        }))}
      />

      <Button type="primary" onClick={() => fetchList(1)}>
        查询
      </Button>

      <Button
        onClick={() => {
          setSearchCustomerId(null);
          //setSearchAccountNo("");
          fetchList(1);
        }}
      >
        重置
      </Button>
    </div>


      <Button type="primary" onClick={openAdd} style={{ marginBottom: 16 }}>
        新增支付账户
      </Button>

      <Table
        rowKey="id"
        dataSource={list}
        columns={columns}
        loading={loading}
        pagination={{
          current: page,
          pageSize: perPage,
          total: total,
          onChange: (p) => fetchList(p),
        }}
      />

      {/* 新增 / 编辑 弹窗 */}
      <Modal
        title={editingId ? "编辑支付账户" : "新增支付账户"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={onSubmit}
        okText="保存"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="客户"
            name="customer_id"
            rules={[{ required: true, message: "请选择客户" }]}
          >
            <Select
              showSearch
              placeholder="请选择客户"
              filterOption={(input, option: any) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              options={customers.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="账户类型"
            name="account_type"
            rules={[{ required: true }]}
          >
            <Select placeholder="请选择账户类型">
              <Option value="银行">银行</Option>
              <Option value="微信">微信</Option>
              <Option value="现金">现金</Option>
              <Option value="支付宝">支付宝</Option>
              <Option value="其它">其它</Option>
            </Select>
          </Form.Item>

          <Form.Item label="账号" name="account_no">
            <Input placeholder="请输入账号" />
          </Form.Item>

          <Form.Item label="银行名称（仅银行卡填写）" name="bank_name">
            <Input placeholder="如：工商银行" />
          </Form.Item>

          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerAccountPage;
