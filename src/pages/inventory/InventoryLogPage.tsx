import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  message,
  Radio,
  Space,
  Spin,
  DatePicker
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import request from '../../utils/request';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

/* =====================
 * 类型定义
 * ===================== */

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

type InventoryAction = 'in' | 'out' | 'adjust';

interface InventoryLog {
  id: number;
  product_name: string;
  action: InventoryAction;
  change_quantity: number;
  before_quantity: number;
  after_quantity: number;
  remark?: string;
  created_at: string;
}

/* =====================
 * 组件
 * ===================== */

const InventoryLogPage: React.FC = () => {
  /* ===== 基础状态 ===== */
  const [specs, setSpecs] = useState<SpecCategory[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(false);

  /* ===== 规格筛选 ===== */
  const [selectedSpecs, setSelectedSpecs] = useState<
    Record<string, string | undefined>
  >({});

  /* ===== 操作类型筛选 ===== */
  const [action, setAction] = useState<InventoryAction | undefined>(undefined);

  /* ===== 时间区间 ===== */
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  /* ===== 分页 ===== */
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 15,
    total: 0,
    showTotal: total => `共 ${total} 条`
  });

  /* =====================
   * 加载规格
   * ===================== */
  const loadSpecs = async () => {
    try {
      const res = await request.get('/api/inventory/spec/list');
      setSpecs(res.data?.data || []);
    } catch {
      message.error('加载规格失败');
    }
  };

  /* =====================
   * 加载库存流水
   * ===================== */
  const loadLogs = async (
    page = 1,
    pageSize = pagination.pageSize!
  ) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: pageSize
      };

      /* ===== 规格参数 ===== */
      const change: Record<string, string> = {};
      Object.entries(selectedSpecs).forEach(([code, value]) => {
        if (value !== undefined) {
          change[code] = value;
        }
      });
      if (Object.keys(change).length > 0) {
        params.change = change;
      }

      /* ===== 操作类型 ===== */
      if (action) {
        params.action = action;
      }

      /* ===== 时间区间 ===== */
      if (dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const res = await request.get(
        '/api/inventory/inventory/logs',
        { params }
      );

      setLogs(res.data?.data || []);
      setPagination(prev => ({
        ...prev,
        current: res.data?.page || page,
        pageSize: res.data?.page_size || pageSize,
        total: res.data?.total || 0
      }));
    } catch {
      message.error('加载库存流水失败');
    } finally {
      setLoading(false);
    }
  };

  /* =====================
   * 初始化
   * ===================== */
  useEffect(() => {
    loadSpecs();
    loadLogs(1);
  }, []);

  /* =====================
   * 任一筛选变化 → 回第一页
   * ===================== */
  useEffect(() => {
    loadLogs(1);
  }, [selectedSpecs, action, dateRange]);

  /* =====================
   * 表格列
   * ===================== */
  const columns: ColumnsType<InventoryLog> = [
    {
      title: '产品',
      dataIndex: 'product_name',
      width: 220,
      ellipsis: true
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 90,
      render: (action: InventoryAction) => {
        if (action === 'in') return <Tag color="green">入库</Tag>;
        if (action === 'out') return <Tag color="red">出库</Tag>;
        return <Tag color="blue">调整</Tag>;
      }
    },
    {
      title: '变动',
      dataIndex: 'change_quantity',
      width: 90,
      render: (v: number) => (
        <Tag color={v >= 0 ? 'green' : 'red'}>
          {v > 0 ? `+${v}` : v}
        </Tag>
      )
    },
    {
      title: '变动前',
      dataIndex: 'before_quantity',
      width: 90
    },
    {
      title: '变动后',
      dataIndex: 'after_quantity',
      width: 90
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 250,
      ellipsis: true
    },
    {
        title: '操作员',
        dataIndex: 'operator_name',
        width: 120,
    },

    {
      title: '时间',
      dataIndex: 'created_at',
      width: 160
    }
  ];

  /* =====================
   * 渲染
   * ===================== */
  return (
    <Card title="库存流水">
      {/* ===== 查询条件区 ===== */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <span>操作类型：</span>
          <Radio.Group
            value={action}
            onChange={e => setAction(e.target.value)}
          >
            <Radio value={undefined}>全部</Radio>
            <Radio value="in">入库</Radio>
            <Radio value="out">出库</Radio>
            <Radio value="adjust">调整</Radio>
          </Radio.Group>

          <span>时间：</span>
          <RangePicker
            allowClear
            value={dateRange}
            onChange={v => setDateRange(v as any)}
          />
        </Space>
      </Card>

      {/* ===== 规格筛选 ===== */}
      <Spin spinning={loading && specs.length === 0}>
        {specs.map(spec => (
          <Card
            key={spec.code}
            size="small"
            style={{ marginBottom: 8 }}
            bodyStyle={{ padding: '6px 12px' }}
          >
            <Space wrap>
              <div style={{ minWidth: 80, fontWeight: 500 }}>
                {spec.name}：
              </div>
              <Radio.Group
                value={selectedSpecs[spec.code]}
                onChange={e =>
                  setSelectedSpecs(prev => ({
                    ...prev,
                    [spec.code]: e.target.value
                  }))
                }
              >
                <Radio value={undefined}>全部</Radio>
                {spec.options.map(opt => (
                  <Radio key={opt.id} value={opt.value}>
                    {opt.value}
                  </Radio>
                ))}
              </Radio.Group>
            </Space>
          </Card>
        ))}
      </Spin>

      {/* ===== 表格 ===== */}
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={logs}
        pagination={{
          ...pagination,
          onChange: (page, pageSize) =>
            loadLogs(page, pageSize)
        }}
      />
    </Card>
  );
};

export default InventoryLogPage;
