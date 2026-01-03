import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
  Divider
} from 'antd';
import request from '../../utils/request';

/* =======================
 * 类型定义
 * ======================= */
interface SpecOption {
  id: number;
  value: string;
}

interface SpecCategory {
  id: number;
  code: string;
  name: string;
  options: SpecOption[];
}

interface Product {
  id: number;
  name: string;
  code?: string;
  remark?: string;
  spec_json: Record<string, string>;
}

/* =======================
 * 组件
 * ======================= */
const ProductManage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [specs, setSpecs] = useState<SpecCategory[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /** 新增时：是否手动编辑过名称 */
  const [nameTouched, setNameTouched] = useState(false);

  /** 查询规格 */
  const [filterSpecs, setFilterSpecs] =
    useState<Record<string, string | undefined>>({});

  const [form] = Form.useForm();

  /* =======================
   * 数据加载
   * ======================= */
  const loadProducts = async () => {
    const res = await request.get('/api/inventory/product/list');
    setProducts(res.data?.data || []);
  };

  const loadSpecs = async () => {
    const res = await request.get('/api/inventory/spec/list');
    setSpecs(res.data?.data || []);
  };

  useEffect(() => {
    loadProducts();
    loadSpecs();
  }, []);

  /* =======================
   * 规格组合生成产品名
   * ======================= */
  const handleValuesChange = (_: any, allValues: any) => {
    if (!nameTouched) {
      const values = allValues.specs || {};
      const parts = Object.values(values).filter(Boolean);
      form.setFieldValue('name', parts.join(''));
    }
  };

  /* =======================
   * 新增产品
   * ======================= */
  const handleAdd = async () => {
    const values = await form.validateFields();

    const rawSpecs = values.specs || {};
    const spec_json = Object.fromEntries(
      Object.entries(rawSpecs).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      )
    );

    if (Object.keys(spec_json).length === 0) {
      message.warning('至少选择一个规格');
      return;
    }

    setLoading(true);
    try {
      const res = await request.post('/api/inventory/product/add', {
        name: values.name,
        code: values.code,
        remark: values.remark,
        spec_json
      });

      if (res.data?.success === false) {
        message.error(res.data.message || '创建失败');
        return;
      }

      message.success('产品创建成功');
      setOpen(false);
      form.resetFields();
      setNameTouched(false);
      loadProducts();
    } finally {
      setLoading(false);
    }
  };

  /* =======================
   * 前端规格过滤
   * ======================= */
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      Object.entries(filterSpecs).every(
        ([code, value]) =>
          !value || p.spec_json?.[code] === value
      )
    );
  }, [products, filterSpecs]);

  /* =======================
   * 表格列
   * ======================= */
  const columns = [
    {
      title: '产品名称',
      dataIndex: 'name'
    },
    {
      title: '规格',
      dataIndex: 'spec_json',
      render: (specs: Record<string, string>) =>
        Object.entries(specs).map(([k, v]) => (
          <Tag key={`${k}-${v}`}>
            {k}:{v}
          </Tag>
        ))
    },
    {
      title: '编码',
      dataIndex: 'code'
    },
    {
      title: '备注',
      dataIndex: 'remark'
    }
  ];

  /* =======================
   * 渲染
   * ======================= */
  return (
    <>
      {/* ===== 查询区 ===== */}
      <Card title="产品查询" size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          {specs.map(spec => (
            <Select
              key={spec.code}
              allowClear
              style={{ width: 180 }}
              placeholder={spec.name}
              value={filterSpecs[spec.code]}
              onChange={value =>
                setFilterSpecs(prev => ({
                  ...prev,
                  [spec.code]: value
                }))
              }
            >
              {spec.options.map(opt => (
                <Select.Option
                  key={opt.id}
                  value={opt.value}
                >
                  {opt.value}
                </Select.Option>
              ))}
            </Select>
          ))}

          <Button
            onClick={() => setFilterSpecs({})}
          >
            重置
          </Button>
        </Space>
      </Card>

      {/* ===== 列表 ===== */}
      <Card
        title="产品管理"
        extra={
          <Button type="primary" onClick={() => setOpen(true)}>
            新增产品
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredProducts}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* ===== 新增弹窗 ===== */}
      <Modal
        open={open}
        title="新增产品"
        onCancel={() => {
          setOpen(false);
          setNameTouched(false);
        }}
        onOk={handleAdd}
        confirmLoading={loading}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleValuesChange}
        >
          <Form.Item name="name" label="产品名称">
            <Input
              placeholder="可自动由规格生成，也可手动修改"
              onChange={() => setNameTouched(true)}
              allowClear
              onClear={() => setNameTouched(false)}
            />
          </Form.Item>

          <Form.Item name="code" label="产品编码">
            <Input />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Divider />

          <Card size="small" title="规格选择（单选，可不选）">
            <Form.Item name="specs" noStyle>
              <Space direction="vertical" style={{ width: '100%' }}>
                {specs.map(spec => (
                  <Form.Item
                    key={spec.code}
                    name={['specs', spec.code]}
                    label={spec.name}
                  >
                    <Select
                      allowClear
                      placeholder={`选择${spec.name}`}
                    >
                      {spec.options.map(opt => (
                        <Select.Option
                          key={opt.id}
                          value={opt.value}
                        >
                          {opt.value}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                ))}
              </Space>
            </Form.Item>
          </Card>
        </Form>
      </Modal>
    </>
  );
};

export default ProductManage;
