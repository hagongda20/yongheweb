import {
  EditableProTable,
  ProColumns,
  ProFormSelect,
} from '@ant-design/pro-components';
import { DatePicker, notification } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';

interface WageLog {
  id: number;
  worker_name: string;
  process: string;
  spec: string;
  actual_price: number;
  quantity: number;
  group_size: number;
  total_wage: number;
  date: string;
  remark?: string;
}

const WageLogPage: React.FC = () => {
  const actionRef = useRef<any>(null);
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [dataSource, setDataSource] = useState<WageLog[]>([]);

  // 搜索条件状态
  const [filterWorker, setFilterWorker] = useState<string>();
  const [filterProcess, setFilterProcess] = useState<string>();
  const [filterDate, setFilterDate] = useState<string>();

  const workers = [
    { label: '张三', value: '张三' },
    { label: '李四', value: '李四' },
  ];
  const processOptions = [
    { label: '铺板', value: '铺板' },
    { label: '热压', value: '热压' },
  ];
  const specOptions = [
    { label: '1220x2440x15', value: '1220x2440x15' },
    { label: '1220x2440x18', value: '1220x2440x18' },
  ];

  // 根据搜索条件过滤数据
  const filteredData = useMemo(() => {
    return dataSource.filter((item) => {
      const matchWorker = !filterWorker || item.worker_name === filterWorker;
      const matchProcess = !filterProcess || item.process === filterProcess;
      const matchDate = !filterDate || item.date === filterDate;
      return matchWorker && matchProcess && matchDate;
    });
  }, [dataSource, filterWorker, filterProcess, filterDate]);

  const columns: ProColumns<WageLog>[] = [
    {
      title: '工人姓名',
      dataIndex: 'worker_name',
      valueType: 'select',
      request: async () => workers,
      formItemProps: { rules: [{ required: true }] },
    },
    {
      title: '工序',
      dataIndex: 'process',
      valueType: 'select',
      request: async () => processOptions,
      formItemProps: { rules: [{ required: true }] },
    },
    {
      title: '规格型号',
      dataIndex: 'spec',
      valueType: 'select',
      request: async () => specOptions,
      formItemProps: { rules: [{ required: true }] },
    },
    {
      title: '工价',
      dataIndex: 'actual_price',
      valueType: 'digit',
      formItemProps: { rules: [{ required: true }] },
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      valueType: 'digit',
      formItemProps: { rules: [{ required: true }] },
    },
    {
      title: '组人数',
      dataIndex: 'group_size',
      valueType: 'digit',
      formItemProps: { rules: [{ required: true }] },
    },
    {
      title: '工资',
      dataIndex: 'total_wage',
      valueType: 'digit',
      renderText: (_: any, row: WageLog) =>
        row.actual_price * row.quantity,
    },
    {
      title: '日期',
      dataIndex: 'date',
      valueType: 'date',
      initialValue: dayjs().format('YYYY-MM-DD'),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      valueType: 'text',
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="delete"
          onClick={() => {
            setDataSource((prev) =>
              prev.filter((item) => item.id !== record.id)
            );
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <ProFormSelect
          name="worker"
          label="工人"
          options={workers}
          fieldProps={{
            value: filterWorker,
            onChange: setFilterWorker,
            allowClear: true,
          }}
        />
        <ProFormSelect
          name="process"
          label="工序"
          options={processOptions}
          fieldProps={{
            value: filterProcess,
            onChange: setFilterProcess,
            allowClear: true,
          }}
        />
        <DatePicker
          style={{ marginTop: 30 }}
          placeholder="选择日期"
          value={filterDate ? dayjs(filterDate) : null}
          onChange={(_, dateString) => setFilterDate(typeof dateString === 'string' ? dateString : undefined)}

        />
      </div>

      <EditableProTable<WageLog>
        headerTitle="工资记录"
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        value={filteredData}
        onChange={(value) => setDataSource([...value])}
        editable={{
          type: 'multiple',
          editableKeys,
          onChange: setEditableRowKeys,
          onSave: async (_, record) => {
            const updatedRow = {
              ...record,
              total_wage: record.actual_price * record.quantity,
            };
            const newData = [...dataSource];
            const index = newData.findIndex((item) => item.id === record.id);
            if (index > -1) {
              newData[index] = updatedRow;
            } else {
              newData.push(updatedRow);
            }
            setDataSource(newData);
            notification.success({ message: '保存成功' });
          },
        }}
        recordCreatorProps={{
          record: () => ({
            id: Date.now(),
            worker_name: '',
            process: '',
            spec: '',
            actual_price: 0,
            quantity: 0,
            group_size: 1,
            total_wage: 0,
            date: dayjs().format('YYYY-MM-DD'),
            remark: '',
          }),
        }}
      />
    </>
  );
};

export default WageLogPage;
