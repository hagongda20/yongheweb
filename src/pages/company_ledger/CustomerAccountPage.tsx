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
   TypeScript 类型定义
----------------------------------- */
interface Customer {
  id: number;
  name: string;
}

interface CustomerAccount {
  id: number;
  customer_id: number;
  customer_name: string; // 后端最好返回此字段（推荐）
  account_type: '银行' | '微信' | '支付宝' | '现金' | '其他';
  account_no?: string;
  bank_name?: string;
  remark?: string;
  is_deleted: boolean;
}

interface AccountForm {
  customer_id: number;
  account_type: string;
  account_no?: string;
  bank_name?: string;
  remark?: string;
}

/* ----------------------------------
   主页面组件
----------------------------------- */
const CustomerAccountPage: React.FC = () => {
  const [list, setList] = useState<CustomerAccount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form] = Form.useForm();

  /* ----------------------------------
     获取客户列表（用于下拉选择）
  ----------------------------------- */
  const fetchCustomers = async () => {
    try {
        const res = await axios.get("/api/customer/");
        //console.log("客户接口返回 >>> ", res.data);

        const list = Array.isArray(res.data.items) ? res.data.items : [];
        setCustomers(list);
    } catch (err) {
        message.error("获取客户列表失败");
    }
    };


  /* ----------------------------------
     获取账户列表
  ----------------------------------- */
  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/customer_account/list");
      setList(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    fetchCustomers();
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
      删除（软删除）
  ----------------------------------- */
  const deleteItem = async (id: number) => {
    try {
      await axios.delete(`/api/customer_account/delete/${id}`);
      message.success("删除成功");
      fetchList();
    } catch (err) {
      message.error("删除失败");
    }
  };

  /* ----------------------------------
      提交（新增 / 编辑）
  ----------------------------------- */
  const onSubmit = async () => {
    try {
      const values: AccountForm = await form.validateFields();

      if (editingId) {
        await axios.put(`/api/customer_account/update/${editingId}`, values);
        message.success("修改成功");
      } else {
        await axios.post(`/api/customer_account/add`, values);
        message.success("新增成功");
      }

      setModalVisible(false);
      fetchList();
    } catch (err) {
      console.log(err);
    }
  };

  /* ----------------------------------
      表格列配置
  ----------------------------------- */
  const columns = [
    {
      title: "客户名称",
      dataIndex: "customer_name",
      width: 150,
    },
    {
      title: "账户类型",
      dataIndex: "account_type",
      //render: (v: string) =>
        //({ bank: "银行", wechat: "微信", alipay: "支付宝", other: "其他" }[v]),
    },
    { title: "账号", dataIndex: "account_no" },
    { title: "银行名称", dataIndex: "bank_name" },
    { title: "备注", dataIndex: "remark" },
    {
      title: "操作",
      width: 160,
      render: (_: any, record: CustomerAccount) => (
        <>
          <Button size="small" type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>

          <Popconfirm
            title="确认删除？"
            onConfirm={() => deleteItem(record.id)}
          >
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

      <Button type="primary" onClick={openAdd} style={{ marginBottom: 16 }}>
        新增支付账户
      </Button>

      <Table
        rowKey="id"
        dataSource={list}
        columns={columns}
        bordered
        loading={loading}
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
