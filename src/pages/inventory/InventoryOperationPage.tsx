import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Radio,
  Space,
  Tag,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import request from '../../utils/request';

/* =====================
 * 类型定义
 * ===================== */

interface SpecCategory {
  id: number;
  code: string;
  name: string;
  options: {
    id: number;
    value: string;
  }[];
}

interface Inventory {
  id: number;
  product_name: string;
  display_name: string;
  spec_json: Record<string, string>;
  quantity: number;
  is_frozen: boolean;
}

type InventoryAction = 'in' | 'out' | 'adjust';

/* =====================
 * 组件
 * ===================== */

const InventoryOperationPage: React.FC = () => {
  const [specs, setSpecs] = useState<SpecCategory[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);

  /* ====== 前端分页 ====== */
  const [page, setPage] = useState(1);
  const pageSize = 10;

  /* ====== 规格选择 ====== */
  const [selectedSpecs, setSelectedSpecs] = useState<
    Record<string, string | undefined>
  >({});

  /* ====== 操作 ====== */
  const [current, setCurrent] = useState<Inventory | null>(null);
  const [currentAction, setCurrentAction] =
    useState<InventoryAction | null>(null);
  const [open, setOpen] = useState(false);

  const [form] = Form.useForm();

  /* =====================
   * 数据加载
   * ===================== */

  const loadSpecs = async () => {
    const res = await request.get('/api/inventory/spec/list');
    setSpecs(res.data?.data || []);
  };

  const loadInventories = async () => {
    setLoading(true);
    try {
      const res = await request.get('/api/inventory/inventory/list');
      setInventories(res.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpecs();
    loadInventories();
  }, []);

  /* =====================
   * 前端规格过滤
   * ===================== */

  const filteredList = inventories.filter((inv) =>
    specs.every((spec) => {
      const selected = selectedSpecs[spec.code];
      if (!selected) return true;
      return inv.spec_json?.[spec.code] === selected;
    })
  );

  /* =====================
   * 前端分页切片
   * ===================== */

  const pagedList = filteredList.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* =====================
   * 打开操作弹窗
   * ===================== */

  const openModal = (record: Inventory, action: InventoryAction) => {
    if (record.is_frozen) {
      message.warning('库存已冻结，禁止操作');
      return;
    }

    setCurrent(record);
    setCurrentAction(action);
    setOpen(true);

    form.setFieldsValue({
      quantity: undefined,
      remark: ''
    });
  };

  /* =====================
   * 提交
   * ===================== */

  const handleSubmit = async () => {
    if (!current || !currentAction) return;

    const values = await form.validateFields();

    await request.post('/api/inventory/inventory/change', {
      inventory_id: current.id,
      action: currentAction,
      quantity: values.quantity,
      remark: values.remark || ''
    });

    message.success('操作成功');
    setOpen(false);
    setCurrent(null);
    setCurrentAction(null);
    form.resetFields();

    loadInventories();
  };

  /* =====================
   * 表格列
   * ===================== */

  const columns: ColumnsType<Inventory> = [
    { title: '产品', dataIndex: 'product_name' },
    {
      title: '规格',
      render: (_, record) =>
        record.spec_json
          ? Object.values(record.spec_json).join(' / ')
          : ''
    },
    { title: '库存名称', dataIndex: 'display_name' },
    {
      title: '库存',
      dataIndex: 'quantity',
      render: (v) =>
        v === 0 ? <Tag color="red">0</Tag> : <Tag color="green">{v}</Tag>
    },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openModal(record, 'in')}>
            入库
          </Button>
          <Button danger size="small" onClick={() => openModal(record, 'out')}>
            出库
          </Button>
          <Button size="small" onClick={() => openModal(record, 'adjust')}>
            调整
          </Button>
        </Space>
      )
    }
  ];

  /* =====================
   * 渲染
   * ===================== */

  return (
    <>
      <Card title="库存操作">
        {/* ====== 横向规格筛选 ====== */}
        {specs.map((spec) => (
          <Card
            key={spec.code}
            size="small"
            style={{ marginBottom: 8 }}
            bodyStyle={{ padding: '8px 12px' }}
          >
            <Space align="center" wrap>
              <div style={{ minWidth: 80, fontWeight: 500 }}>
                {spec.name}：
              </div>

              <Radio.Group
                value={selectedSpecs[spec.code]}
                onChange={(e) => {
                  setSelectedSpecs((prev) => ({
                    ...prev,
                    [spec.code]: e.target.value
                  }));
                  setPage(1); // ⭐ 切换筛选条件回到第一页
                }}
              >
                <Radio value={undefined}>全部</Radio>
                {spec.options.map((opt) => (
                  <Radio key={opt.id} value={opt.value}>
                    {opt.value}
                  </Radio>
                ))}
              </Radio.Group>
            </Space>
          </Card>
        ))}

        {/* ====== 库存表格（前端分页） ====== */}
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={pagedList}
          pagination={{
            current: page,
            pageSize,
            total: filteredList.length,
            onChange: (p) => setPage(p),
            showSizeChanger: false
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* ====== 操作弹窗 ====== */}
      <Modal
        open={open}
        title={
          currentAction === 'in'
            ? '入库'
            : currentAction === 'out'
            ? '出库'
            : '库存调整'
        }
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
      >
        {current && (
          <>
            <p>
              <b>库存：</b>
              {current.display_name}
            </p>
            <p>
              <b>当前数量：</b>
              {current.quantity}
            </p>

            <Form form={form} layout="vertical">
              <Form.Item
                name="quantity"
                label="数量"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={currentAction === 'adjust' ? -999999 : 1}
                />
              </Form.Item>

              <Form.Item name="remark" label="备注">
                <Input />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </>
  );
};

export default InventoryOperationPage;
