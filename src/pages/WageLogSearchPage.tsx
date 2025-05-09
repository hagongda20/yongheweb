import React, { useEffect, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Form, DatePicker, Select, Button, SelectProps, Space, Statistic } from 'antd';
import dayjs from 'dayjs';
import { getWorkers } from '../services/workers';
import { getProcesses } from '../services/processes';
import { getFilteredWageLogs } from '../services/wageLogs';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

//import type { WageLog } from '@/types';
import type { ProColumns } from '@ant-design/pro-components';

interface WageLog {
  id: number;
  worker: string;
  worker_id: number;
  process: string;
  process_id: number;
  spec_model: string;
  spec_model_id: number;
  actual_price: number;
  quantity: number;
  actual_group_size: number;
  total_wage: number;
  date: string;
  remark?: string;
}

interface Worker {
  id: number;
  name: string;
  id_card: string;
  remark: string;
  group: string;
  process_id: number;
  process_name: string;
}

interface Process {
  id: number;
  name: string;
  description: string;
}

const { RangePicker } = DatePicker;

const WageLogSearchPage: React.FC = () => {
  const [form] = Form.useForm();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [dataSource, setDataSource] = useState<WageLog[]>([]);
  const [totalWage, setTotalWage] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 加载工人
  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const res = await getWorkers();
        //console.log(res);
        const workersWithProcessName = res.data.workers.map((w: any) => ({
          ...w,
          process_name: w.process.name || '',
          process_id: w.process.id || '',
        }));
        //console.log("所有工人记录：", workersWithProcessName);
        setWorkers(workersWithProcessName);
      } catch (error) {
        console.error('加载工人失败:', error);
      }
    };
    loadWorkers();
  }, []);
  
  // 加载工序
  useEffect(() => {
    const loadProcesses = async () => {
      try {
        const res = await getProcesses();
        setProcesses(res.processes);
      } catch (error) {
        console.error('加载工序失败:', error);
      }
    };
    loadProcesses();
  }, []);

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const res = await getFilteredWageLogs({
        start_date: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: values.dateRange?.[1]?.format('YYYY-MM-DD'),
        worker_id: values.workerId || '',
        process_id: values.process_id || '',
        //page: pagination.current,
        //page_size: pagination.pageSize,
      });
      //console.log('综合查询：',res)
      setDataSource(res.wage_logs || []);
      setPagination((prev) => ({
        ...prev,
        total: res.total || 0,
      }));

      // 计算工资总和
      const total = (res.wage_logs || []).reduce((sum: number, item: WageLog) => sum + item.total_wage, 0);
      setTotalWage(total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 导出数据到Excel表中
  const exportToExcel = () => {
    if (!dataSource.length) return;
  
    // 获取所有日期（升序）
    const allDates = Array.from(new Set(dataSource.map(item => item.date))).sort();
  
    // 获取所有工人
    const allWorkers = Array.from(new Set(dataSource.map(item => item.worker)));
  
    // 构造表格数据
    const data: any[] = [];
  
    allWorkers.forEach(worker => {
      const row: any = { 工人: worker };
      let total = 0;
  
      allDates.forEach(date => {
        const logs = dataSource.filter(item => item.worker === worker && item.date === date);
        const wage = logs.reduce((sum, item) => sum + item.total_wage, 0);
        row[date] = wage;
        total += wage;
      });
  
      row['工资合计'] = total;
      data.push(row);
    });
  
    // 创建 worksheet 和 workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '工资报表');
  
    // 获取文件名
    const start = form.getFieldValue('dateRange')?.[0]?.format('YYYY-MM-DD') || '';
    const end = form.getFieldValue('dateRange')?.[1]?.format('YYYY-MM-DD') || '';
    const filename = `工资报表_${start}_${end}.xlsx`;
  
    // 导出
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, filename);
  };
  
  // 导出查询记录
  const exportToExcelDaily = () => {
    if (!dataSource.length) return;
  
    const allDates = Array.from(new Set(dataSource.map(item => item.date))).sort();
    const allWorkers = Array.from(new Set(dataSource.map(item => item.worker)));
  
    const data: any[] = [];
  
    allWorkers.forEach(worker => {
      const row: any = { 工人: worker };
      let total = 0;
  
      allDates.forEach(date => {
        const logs = dataSource.filter(item => item.worker === worker && item.date === date);
        const wage = logs.reduce((sum, item) => sum + item.total_wage, 0);
        row[date] = wage;
        total += wage;
      });
  
      row['工资合计'] = total;
      data.push(row);
    });
  
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '工资日薪表');
  
    const start = form.getFieldValue('dateRange')?.[0]?.format('YYYY-MM-DD') || '';
    const end = form.getFieldValue('dateRange')?.[1]?.format('YYYY-MM-DD') || '';
    const filename = `工资报表_${start}_${end}.xlsx`;
  
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, filename);
  };
  
  // 导出前查询记录排序
  const exportToExcelRaw = () => {
    if (!dataSource.length) return;
  
    // 按工人 → 日期 排序
    const sortedData = [...dataSource].sort((a, b) => {
      if (a.worker < b.worker) return -1;
      if (a.worker > b.worker) return 1;
      return a.date.localeCompare(b.date);
    });
  
    // 转换为导出格式
    const exportData = sortedData.map(item => ({
      工人: item.worker,
      工序: item.process,
      组人数: item.actual_group_size,
      规格型号: item.spec_model,
      日期: item.date,
      数量: item.quantity,
      单价: item.actual_price,
      工资: item.total_wage,
      备注: item.remark || '',
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '工资记录');
  
    const start = form.getFieldValue('dateRange')?.[0]?.format('YYYY-MM-DD') || '';
    const end = form.getFieldValue('dateRange')?.[1]?.format('YYYY-MM-DD') || '';
    const filename = `查询记录_${start}_${end}.xlsx`;
  
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, filename);
  };
  

  const columns: ProColumns<WageLog>[] = [
    { title: '日期', dataIndex: 'date', valueType: 'text', align: 'center', width:120 },
    { title: '工人', dataIndex: 'worker', valueType: 'text', align: 'center' },
    { title: '工序', dataIndex: 'process', valueType: 'text', align: 'center' },
    { title: '规格型号', dataIndex: 'spec_model', valueType: 'text', align: 'center' },
    { title: '单价', dataIndex: 'actual_price', valueType: 'money', align: 'center', width:120 },
    { title: '数量', dataIndex: 'quantity', align: 'center', width:80 },
    { title: '组人数', dataIndex: 'actual_group_size', align: 'center', width:80 },
    { title: '工资', dataIndex: 'total_wage', valueType: 'money', align: 'center', width:120 },
    { title: '备注', dataIndex: 'remark', align: 'center' },
  ];


  return (
    <div>
      <Form
        form={form}
        layout="inline"
        initialValues={{
          dateRange: [dayjs(), dayjs()],
        }}
        onFinish={() => {
          setPagination({ ...pagination, current: 1 }); // 重置分页
          fetchData();
        }}
      >
        <Form.Item name="dateRange" label="日期区间">
          <RangePicker />
        </Form.Item>
        <Form.Item name="workerId" label="工人">
          <Select
            showSearch
            placeholder="请输入工人姓名"
            style={{ width: 200 }}
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            options={workers.map(item => ({
              label: item.name,
              value: item.id,
            }))}
            allowClear
          />
        </Form.Item>
        <Form.Item name="process_id" label="工序">
          <Select 
            showSearch
            placeholder="选择工序" 
            style={{ width: 160 }} 
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            options={processes.map(item => ({
              label: item.name,
              value: item.id,
            }))} 
            allowClear 
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">查询</Button>
        </Form.Item>
      </Form>

      <div style={{ display: 'flex', alignItems: 'center', marginTop: 16, marginBottom: 16 }}>
        <Statistic title="工资总和" value={totalWage} precision={2} prefix="¥" />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button onClick={exportToExcelDaily} type="default">导出日薪工资记录</Button>
          <Button onClick={exportToExcelRaw} type="default">导出查询记录</Button>
        </div>
      </div>


      <ProTable<WageLog>
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: false,
          onChange: (page) => setPagination((prev) => ({ ...prev, current: page })),
        }}
        search={false}
        toolBarRender={false}
      />
    </div>
  );
};

export default WageLogSearchPage;
