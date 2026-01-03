import React, { useEffect, useState, useMemo } from 'react';
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
  Switch,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import request from '../../utils/request';

/* =====================
 * 类型定义
 * ===================== */

interface SpecCategory {
  id: number;
  code: string; // 用于匹配 inventory.spec_json
  name: string; // 显示名称（长度、工艺…）
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
  warning_min_quantity: number;
  is_frozen: boolean;
}

/* =====================
 * 页面组件
 * ===================== */

const InventoryCheckPage: React.FC = () => {
  const [specs, setSpecs] = useState<SpecCategory[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);

  /* ===== 规格查询（同出入库） ===== */
  const [selectedSpecs, setSelectedSpecs] = useState<
    Record<string, string | undefined>
  >({});

  /* ===== 低于库存预警查询 ===== */
  const [lowStockOnly, setLowStockOnly] = useState(false);

  /* ===== 盘点 ===== */
  const [current, setCurrent] = useState<Inventory | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  /* ===== 前端分页 ===== */
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
   * 前端规格 + 低库存过滤
   * ===================== */
  const filteredList = useMemo(() => {
    return inventories.filter((inv) => {
      // 规格过滤
      const specMatch = specs.every((spec) => {
        const selected = selectedSpecs[spec.code];
        if (!selected) return true;
        return inv.spec_json?.[spec.code] === selected;
      });
      // 低库存过滤
      const lowStockMatch = lowStockOnly
        ? inv.quantity < inv.warning_min_quantity
        : true;
      return specMatch && lowStockMatch;
    });
  }, [inventories, specs, selectedSpecs, lowStockOnly]);

  const pagedList = filteredList.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* =====================
   * 打开盘点弹窗
   * ===================== */
  const openModal = (record: Inventory) => {
    if (record.is_frozen) {
      message.warning('库存已冻结，禁止盘点');
      return;
    }

    setCurrent(record);
    setOpen(true);

    form.setFieldsValue({
      actual_quantity: record.quantity,
      remark: ''
    });
  };

  /* =====================
   * 提交盘点（本质 = adjust）
   * ===================== */
  const handleSubmit = async () => {
    if (!current) return;

    const values = await form.validateFields();
    const actualQty = Number(values.actual_quantity);
    const diff = actualQty - current.quantity;

    if (diff === 0) {
      message.info('库存无变化，无需盘点');
      return;
    }

    await request.post('/api/inventory/inventory/change', {
      inventory_id: current.id,
      action: 'adjust',
      quantity: diff,
      remark: values.remark || '库存盘点'
    });

    message.success('盘点完成');
    setOpen(false);
    setCurrent(null);
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
      render: (_, r) =>
        r.spec_json ? Object.values(r.spec_json).join(' / ') : ''
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
        <Button size="small" onClick={() => openModal(record)}>
          盘点
        </Button>
      )
    }
  ];

  /* =====================
   * 渲染
   * ===================== */
  return (
    <>
      <Card
        title="库存盘点"
        extra={
          <Space>
            <span>仅显示低于库存预警：</span>
            <Switch
              checked={lowStockOnly}
              onChange={(v) => {
                setLowStockOnly(v);
                setPage(1);
              }}
            />
          </Space>
        }
      >
        {/* ===== 规格查询（最左侧显示名称） ===== */}
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
                  setPage(1);
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

        {/* ===== 库存表格 ===== */}
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

      {/* ===== 盘点弹窗 ===== */}
      <Modal
        open={open}
        title="库存盘点"
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
              <b>当前库存：</b>
              {current.quantity}
            </p>

            <Form form={form} layout="vertical">
              <Form.Item
                name="actual_quantity"
                label="实际库存"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
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

export default InventoryCheckPage;
