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
  Modal,
  DatePicker,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { ColumnType } from "antd/es/table";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface OptionItem {
  customer_id: number;
  company_id: any;
  value: number | string;
  label: string;
}

interface TransactionItem {
  status: any;
  date: any;
  company_name: any;
  customer_name: any;
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

  const [filteredCompanyAccounts, setFilteredCompanyAccounts] = useState<OptionItem[]>([]);
  const [filteredCustomerAccounts, setFilteredCustomerAccounts] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);


  const [list, setList] = useState<TransactionItem[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadInitData();
    loadList();
  }, []);

  /** 初始化下拉 */
  const loadInitData = async () => {
    const companyRes = await axios.get("/api/company/list");   //目前，后台就是用list查询的全部公司，公司少，不用改
    setCompanies(companyRes.data.data.map((c: any) => ({ value: c.id, label: c.name })));

    const customerRes = await axios.get("/api/customer/all");
    setCustomers(customerRes.data.items.map((c: any) => ({ value: c.id, label: c.name })));

    const companyAccountRes = await axios.get("/api/company_account/all");
    setCompanyAccounts(
      companyAccountRes.data.items.map((c: any) => ({ value: c.id, label: c.account_name, company_id: c.company_id}))
    );

    const customerAccountRes = await axios.get("/api/customer_account/list");   //目前，list就是查询的全部
    setCustomerAccounts(
      customerAccountRes.data.data.map((c: any) => ({ value: c.id, label: c.account_no, customer_id: c.customer_id }))
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
    //
    //console.log('流水数据：', res.data.data);
    setList(res.data.data || []);
    setTotalAmount(res.data.total_amount || 0);
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

    /** ★ 1. 过滤公司账户 */
    const filteredCom = companyAccounts.filter(
        (acc) => acc.company_id === record.company_id
    );
    setFilteredCompanyAccounts(filteredCom);

    /** ★ 2. 过滤客户账户（你缺的） */
    const filteredCus = customerAccounts.filter(
        (acc) => acc.customer_id === record.customer_id
    );
    setFilteredCustomerAccounts(filteredCus);

    /** ★ 3. 设置表单值 */
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


  /** 导出全部数据（根据查询条件重新请求一次） */
  const exportExcel = async () => {
    try {
        // 1) 获取查询条件
        const query = queryForm.getFieldsValue();

        if (query.dateRange) {
        query.start_date = query.dateRange[0].format("YYYY-MM-DD");
        query.end_date = query.dateRange[1].format("YYYY-MM-DD");
        }

        // 2) 加参数让后端返回全部数据（你的列表接口支持 per_page=0）
        const params = {
        ...query,
        //per_page: 0, // ★ 关键：不分页，返回全部
        };

        const res = await axios.get("/api/transaction/all", { params });

        const items = res.data.data || [];

        if (!items.length) {
        message.warning("没有可导出的数据");
        return;
        }

        // 3) 映射字段到 Excel 列
        const sheetData = items.map((item: any) => ({
        公司: item.company_name,
        客户: item.customer_name,
        客户账户: item.customer_account_name,
        方向: item.direction,
        金额: item.amount,
        方法: item.method,
        状态: item.status,
        交易号: item.reference_no,
        备注: item.remark,
        创建时间: item.created_at,
        更新时间: item.updated_at,
        }));

        // 4) 生成 Excel
        const ws = XLSX.utils.json_to_sheet(sheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "流水数据");

        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(
        new Blob([excelBuffer]),
        `流水查询_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.xlsx`
        );

        message.success(`成功导出 ${items.length} 条记录`);

    } catch (err) {
        console.error(err);
        message.error("导出失败，请检查网络或后端接口");
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

  // 监听客户变化
  const onCustomerChange = (customerId: number) => {
    const list = customerAccounts.filter(acc => acc.customer_id === customerId);
    setFilteredCustomerAccounts(list);

    // 公司变了，公司账户要清空
    form.setFieldsValue({ customer_account_id: undefined });
  };


    const columns: ColumnType<TransactionItem>[] = [
    {
        title: "序号",
        width: 60,
        align: "center",
        dataIndex: "__index", // 虚拟字段，用不到但 TS 必须有
        render: (_: any, __: any, index: number) => index + 1,
    },
    {
        title: "公司",
        dataIndex: "company_id",
        align: "center",
        render: (id: number) => {
        const item = companies.find((c) => c.value === id);
        return item ? item.label : "-";
        },
    },
    {
        title: "客户",
        dataIndex: "customer_id",
        align: "center",
        render: (id: number) => {
        const item = customers.find((c) => c.value === id);
        return item ? item.label : "-";
        },
    },
    {
        title: "客户账户",
        dataIndex: "customer_account_id",
        align: "center",
        render: (id: number) => {
        const item = customerAccounts.find((c) => c.value === id);
        return item ? item.label : "-";
        },
    },
    {
        title: "金额",
        dataIndex: "amount",
        align: "center",
    },
    {
        title: "方向",
        width: 60,
        dataIndex: "direction",
        align: "center",
    },
    {
        title: "方式",
        width: 60,
        dataIndex: "method",
        align: "center",
    },
    {
        title: "交易号",
        dataIndex: "reference_no",
        align: "center",
    },
    {
        title: "备注",
        dataIndex: "remark",
        align: "center",
    },
    {
        title: "创建时间",
        width: 160,
        dataIndex: "created_at",
        align: "center",
        render: (v: string) =>
        v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
        title: "更新时间",
        width: 160,
        dataIndex: "updated_at",
        align: "center",
        render: (v: string) =>
        v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
        title: "操作",
        width: 60,
        align: "center",
        dataIndex: "__action",
        render: (_: any, record: TransactionItem) => (
        <Space>
            <Button type="link" onClick={() => handleEdit(record)}>编辑</Button>
            <Button type="link" danger onClick={() => handleDelete(record)}>删除</Button>
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
                    <Select
                        showSearch                     // 允许输入
                        allowClear
                        placeholder="请选择客户"
                        style={{ width: 180 }}
                        optionFilterProp="label"       // 使用 label 进行过滤
                        filterOption={(input, option) =>
                            (option?.label ?? '')
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        }
                        options={customers}            // 直接绑定你的 options
                    />
                </Form.Item>

                <Form.Item name="direction" label="方向">
                <Select placeholder="请选择方向" allowClear style={{ width: 120 }}>
                    <Select.Option value="in">收入</Select.Option>
                    <Select.Option value="out">支出</Select.Option>
                </Select>
                </Form.Item>

                <Form.Item name="dateRange" label="时间范围">
                <RangePicker />
                </Form.Item>

                <Form.Item>
                <Button type="primary" onClick={loadList}>查询</Button>
                </Form.Item>
                <Form.Item>
                <Button onClick={() => queryForm.resetFields()}>重置</Button>
                </Form.Item>
                <Form.Item>
                <Button type="primary" ghost onClick={handleCreate}>新增流水</Button>
                </Form.Item>
                <Form.Item>
                <Button onClick={exportExcel}>导出 Excel</Button>
                </Form.Item>
            </Form>
        </Card>

        {/* ⭐⭐⭐ 总金额显示（新增部分） */}
        <div 
            style={{ 
                display: "flex", 
                justifyContent: "space-between",
                marginBottom: 12, 
                fontSize: 16, 
                fontWeight: 600 
            }}
            >
            <span>页面总金额：{list.reduce((sum, item) => sum + (item.amount || 0), 0)}</span>
            <span>查询总金额：{totalAmount}</span>
        </div>


        {/* 表格 */}
        <Table
        rowKey="id"
        columns={columns}
        dataSource={list}
        pagination={{ pageSize: 10 }}
        />

        {/* 弹窗表单 */}
        <Modal
        title={editingId ? "编辑流水" : "新增流水"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        destroyOnClose
        >
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="company_id" label="公司" rules={[{ required: true }]}>
            <Select
                placeholder="选择公司"
                onChange={(val) => {
                const list = companyAccounts.filter(acc => acc.company_id === val);
                setFilteredCompanyAccounts(list);
                form.setFieldsValue({ company_account_id: undefined });
                }}
            >
                {companies.map((i) => (
                <Select.Option key={i.value} value={i.value}>{i.label}</Select.Option>
                ))}
            </Select>
            </Form.Item>

            <Form.Item name="company_account_id" label="公司账户" rules={[{ required: true }]}>
            <Select placeholder="选择公司账户">
                {filteredCompanyAccounts.map((i) => (
                <Select.Option key={i.value} value={i.value}>{i.label}</Select.Option>
                ))}
            </Select>
            </Form.Item>

            <Form.Item name="customer_id" label="客户" rules={[{ required: true }]}>
            <Select
                placeholder="选择客户"
                onChange={onCustomerChange}
            >
                {customers.map((i) => (
                <Select.Option key={i.value} value={i.value}>{i.label}</Select.Option>
                ))}
            </Select>
            </Form.Item>

            <Form.Item name="customer_account_id" label="客户账户" rules={[{ required: true }]}>
            <Select placeholder="选择客户账户">
                {filteredCustomerAccounts.map((i) => (
                <Select.Option key={i.value} value={i.value}>{i.label}</Select.Option>
                ))}
            </Select>
            </Form.Item>

            <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="direction" label="方向" rules={[{ required: true }]}>
            <Select>
                <Select.Option value="in">收入</Select.Option>
                <Select.Option value="out">支出</Select.Option>
            </Select>
            </Form.Item>

            <Form.Item name="method" label="方式">
            <Input />
            </Form.Item>

            <Form.Item name="reference_no" label="交易号">
            <Input />
            </Form.Item>

            <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
            </Form.Item>
        </Form>
        </Modal>
    </div>
  );
}

export default TransactionPage;


