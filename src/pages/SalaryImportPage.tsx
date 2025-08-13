// SalaryImportPage.tsx
import React, { useState, useEffect } from 'react';
import { Upload, Button, Table, message, Progress } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { getSpecModels } from '../services/specModel';
import { getWorkers } from '../services/workers';
import { batchCreateWageLogs } from '../services/wageLogs';
import { getProcesses } from '../services/processes';

interface SpecModel {
  id: number;
  process_name: string;
  name: string;
  price: string | number;
  process_id: number;
}

interface Worker {
  id: number;
  name: string;
  process_id: number;
  process_name: string;
}

interface Process {
    id: number;
    name: string;
    description: string;
  }
  

const styles = `
  .row-green { background-color: #d9f7be !important; }
  .row-red { background-color: #ffd6d6 !important; }
`;

const SalaryImportPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [allSpecModels, setAllSpecModels] = useState<SpecModel[]>([]);
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [processes, setProcesses] = useState<Process[]>([]);

  // 加载工人
  useEffect(() => {
    const loadAllWorkers = async () => {
      try {
        const res = await getWorkers();
        const workersWithProcess = res.data.workers.map((w: any) => ({
          id: w.id,
          name: w.name,
          process_id: w.process?.id || 0,
          process_name: w.process?.name || '',
        }));
        setAllWorkers(workersWithProcess);
      } catch (error) {
        message.error('加载工人失败');
      }
    };
    loadAllWorkers();
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
  
  // 加载规格和工价
  useEffect(() => {
    const loadAllSpecModels = async () => {
      try {
        const res = await getSpecModels();
        const specs = res.specModels.map((s: any) => ({
          id: s.id,
          process_name: s.process_name,
          name: s.name,
          price: s.price,
        }));
        setAllSpecModels(specs);
      } catch (error) {
        message.error('加载规格工价失败');
      }
    };
    loadAllSpecModels();
  }, []);

  // 查找工价
  const findPrice = (processName: string, specName: string): number => {
    const item = allSpecModels.find(
      (spec) => spec.process_name === processName && spec.name === specName
    );
    return item ? Number(item.price) : 0;
  };

  // Excel解析
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryStr = e.target?.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length === 0) {
        message.warning('Excel 文件内容为空');
        return;
      }

      const headers = jsonData[0] as string[];
      const newHeaders = [...headers];
      if (!newHeaders.includes('工人ID')) newHeaders.unshift('工人ID');
      if (!newHeaders.includes('单价')) newHeaders.push('单价');
      if (!newHeaders.includes('金额')) newHeaders.push('金额');

      const rows = jsonData.slice(1).map((row: any, index: number) => {
        const rowObj: any = { key: index };
        headers.forEach((header, i) => {
          rowObj[header] = (row[i] ?? '').toString().trim();
        });
        rowObj['工人ID'] = 0;
        rowObj['单价'] = 0;
        rowObj['金额'] = 0;
        return rowObj;
      });

      setColumns(newHeaders.map((h) => ({ title: h, dataIndex: h, key: h })));
      setData(rows);
    };
    reader.readAsBinaryString(file);
    return false;
  };

  // 核查人员
  const checkWorkers = () => {
    let unmatchedCount = 0;
    const newData = data.map((row) => {
      const worker = allWorkers.find((w) => w.name === row['工人']);
      if (!worker) {
        unmatchedCount++;
        return { ...row, _rowStatus: 'red', '工人ID': 0 };
      }
      return { ...row, _rowStatus: '', '工人ID': worker.id };
    });
    setData(newData);
    message.info(`未匹配工人数：${unmatchedCount}`);
  };

  // 核查单价并计算金额
  const checkPriceAndCompute = () => {
    let unmatchedCount = 0;
    const newData = data.map((row) => {
      const price = findPrice(row['工序'], row['规格型号']);
      const qty = Number(row['数量']) || 0;
      const group = Number(row['组人数']) || 1;
      const amount = group === 0 ? 0 : (price * qty) / group;

      if (price === 0) unmatchedCount++;
      return {
        ...row,
        _rowStatus: price === 0 ? 'red' : 'green',
        '单价': Number(price.toFixed(2)),
        '金额': Number(amount.toFixed(1)),
      };
    });
    setData(newData);
    message.info(`未查到工价的记录数：${unmatchedCount}`);
  };

  // 批量导入到数据库
  const importToDB = async () => {
    try {
      if (data.length === 0) {
        message.warning('没有可导入的数据');
        return;
      }
  
      const batchSize = 500; // 分批提交
      const totalBatches = Math.ceil(data.length / batchSize);
  
      // 建立映射，加快查找
      const workerMap = Object.fromEntries(allWorkers.map((w) => [w.name, w.id]));
      const specMap = Object.fromEntries(
        allSpecModels.map((s) => [`${s.process_name}_${s.name}`, { id: s.id, process_id: s.process_id }])
      );
  
      for (let i = 0; i < data.length; i += batchSize) {
        const chunk = data.slice(i, i + batchSize).map((row) => ({
            worker_id: allWorkers.find((w) => w.name === row['工人'])!.id, // 用 ! 确保非 null
            process_id: processes.find((s) => s.name === row['工序'])!.id!,
            spec_model_id: allSpecModels.find((s) => s.process_name === row['工序'] && s.name === row['规格型号'])!.id!,
            date: row['日期'],
            actual_price: Number(row['单价']),
            quantity: Number(row['数量']),
            actual_group_size: Number(row['组人数']),
            total_wage: Number(row['金额']),
            remark: row['备注'] || '',
          }));
  
        console.log(`批量导入数据[${i}~${i + batchSize}]:`, chunk);
  
        // 调用批量创建接口
        await batchCreateWageLogs(chunk);
  
        message.info(`已导入 ${Math.min(i + batchSize, data.length)} / ${data.length}`);
      }
  
      message.success('批量导入完成！');
    } catch (error) {
      console.error('批量导入失败：', error);
      message.error('批量导入失败，请检查控制台');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <style>{styles}</style>
      <h2>薪资导入（前台解析+批量导入）</h2>
      <Upload
        beforeUpload={handleFile}
        accept=".xlsx,.xls"
        maxCount={1}
        showUploadList={false}
      >
        <Button icon={<UploadOutlined />}>选择 Excel 文件</Button>
      </Upload>

      <div style={{ margin: '10px 0' }}>
        <Button type="primary" onClick={checkWorkers} style={{ marginRight: 10 }}>
          核查人员
        </Button>
        <Button type="primary" onClick={checkPriceAndCompute} style={{ marginRight: 10 }}>
          核查单价并计算薪资
        </Button>
        <Button type="primary" onClick={importToDB}>
          批量导入到数据库
        </Button>
      </div>

      {progress > 0 && <Progress percent={progress} />}

      <Table
        dataSource={data}
        columns={columns}
        pagination={false}
        rowClassName={(record) =>
            record._workerMatched === false || record._priceMatched === false ? 'row-red' : ''
          }
        style={{ marginTop: 20 }}
      />
    </div>
  );
};

export default SalaryImportPage;
