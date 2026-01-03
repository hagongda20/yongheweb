import { useEffect, useMemo, useState } from 'react';
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
  message,
  Switch,
  Select
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
  spec_json: Record<string, string>; // code -> value
  quantity: number;
  warning_min_quantity: number;
  warning_max_quantity?: number;
  is_frozen: boolean;
}

/* =====================
 * 组件
 * ===================== */

const InventoryLedger: React.FC = () => {
  const [specs, setSpecs] = useState<SpecCategory[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);

  /* ====== 前端分页 ====== */
  const [page, setPage] = useState(1);
  const pageSize = 10;

  /* ====== 规格选择 ====== */
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string | undefined>>({});

  /* ====== 低库存开关 ====== */
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  /* ====== 弹窗操作 ====== */
  const [current, setCurrent] = useState<Inventory | null>(null);
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
   * 过滤列表（按规格名称 + 低库存）
   * ===================== */
  const filteredList = useMemo(() => {
    return inventories.filter((inv) => {
      // 规格过滤
      for (const spec of specs) {
        const selectedValue = selectedSpecs[spec.code];
        if (!selectedValue) continue;
        const actualValue = inv.spec_json?.[spec.code];
        if (actualValue !== selectedValue) return false;
      }
      // 低库存过滤
      if (onlyLowStock && inv.quantity >= inv.warning_min_quantity) return false;

      return true;
    });
  }, [inventories, selectedSpecs, specs, onlyLowStock]);

  const pagedList = filteredList.slice((page - 1) * pageSize, page * pageSize);

  /* =====================
   * 弹窗提交
   * ===================== */
  const handleSubmit = async () => {
    const values = await form.validateFields();

    if (current) {
      await request.post('/api/inventory/inventory/update', {
        id: current.id,
        display_name: values.display_name,
        warning_min_quantity: values.warning_min_quantity,
        warning_max_quantity: values.warning_max_quantity,
        is_frozen: values.is_frozen
      });
      message.success('库存信息已更新');
    } else {
      await request.post('/api/inventory/inventory/add', {
        product_id: values.product_id,
        display_name: values.display_name,
        warning_min_quantity: values.warning_min_quantity || 0,
        warning_max_quantity: values.warning_max_quantity,
        is_frozen: values.is_frozen || false
      });
      message.success('库存初始化成功');
    }

    setOpen(false);
    setCurrent(null);
    form.resetFields();
    loadInventories();
  };

  /* =====================
   * 表格列
   * ===================== */
  const columns: ColumnsType<Inventory> = [
    { title: '产品名称', dataIndex: 'product_name', fixed: 'left' },
    {
      title: '规格',
      render: (_, r) =>
        r.spec_json
          ? Object.entries(r.spec_json)
              .map(([code, value]) => {
                const spec = specs.find((s) => s.code === code);
                return spec ? value : value; // 可以替换成 spec.name + value
              })
              .join(' / ')
          : ''
    },
    { title: '显示名称', dataIndex: 'display_name' },
    {
      title: '库存数量',
      dataIndex: 'quantity',
      render: (v, r) => (v < r.warning_min_quantity ? <Tag color="red">{v}</Tag> : <Tag color="green">{v}</Tag>)
    },
    { title: '预警下限', dataIndex: 'warning_min_quantity' },
    {
      title: '状态',
      dataIndex: 'is_frozen',
      render: (v) => (v ? <Tag color="red">冻结</Tag> : <Tag color="green">正常</Tag>)
    },
    {
      title: '操作',
      fixed: 'right',
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => {
            setCurrent(record);
            form.setFieldsValue(record);
            setOpen(true);
          }}
        >
          编辑
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
        title="库存台账"
        extra={
          <Button
            type="primary"
            onClick={() => {
              setCurrent(null);
              form.resetFields();
              setOpen(true);
            }}
          >
            初始化库存
          </Button>
        }
      >
        {/* ====== 横向规格筛选 ====== */}
        {specs.map((spec) => (
          <Card
            key={spec.code}
            size="small"
            style={{ marginBottom: 8 }}
            bodyStyle={{ padding: '8px 12px' }}
          >
            <Space align="center" wrap>
              <div style={{ minWidth: 80, fontWeight: 500, color: '#555' }}>{spec.name}：</div>
              <Radio.Group
                value={selectedSpecs[spec.code]}
                onChange={(e) => {
                  setSelectedSpecs((prev) => ({ ...prev, [spec.code]: e.target.value }));
                  setPage(1); // 切换规格回到第一页
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

        {/* ====== 低库存开关 ====== */}
        <Space style={{ marginBottom: 12 }}>
          <span>低于最低库存</span>
          <Switch checked={onlyLowStock} onChange={(v) => setOnlyLowStock(v)} />
        </Space>

        {/* ====== 表格分页显示 ====== */}
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

      {/* ====== 弹窗 ====== */}
      <Modal
        open={open}
        title={current ? '编辑库存信息' : '初始化库存'}
        onCancel={() => {
          setOpen(false);
          setCurrent(null);
        }}
        onOk={handleSubmit}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
          {!current && (
            <Form.Item name="product_id" label="产品" rules={[{ required: true }]}>
              <Select placeholder="选择产品">
                {inventories
                  .filter((p) => !inventories.some((inv) => inv.id === p.id))
                  .map((p) => (
                    <Select.Option key={p.id} value={p.id}>
                      {p.product_name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="display_name" label="显示名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="warning_min_quantity" label="预警下限">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="warning_max_quantity" label="预警上限">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="is_frozen" label="是否冻结" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default InventoryLedger;
