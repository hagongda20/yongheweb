import {
  EditableProTable,
  ProColumns,
  ProFormSelect,
} from '@ant-design/pro-components';
import { DatePicker, notification } from 'antd';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { getWorkers } from '../services/workers';
import { getProcesses } from '../services/processes';
import { getSpecModels } from '../services/specModel';
import { getWageLogs, updateWageLog, createWageLog } from '../services/wageLogs';
import dayjs from 'dayjs';

interface WageLog {
  id: number;
  worker: string;
  worker_id: number;
  process: string;
  process_id: number;
  //spec_model: string;
  spec_model_id: number;
  actual_price: number;
  quantity: number;
  group_size: number;
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

interface SpecModel {
  id: number;
  name: string;
  price: number;
  process_id: number;
}


interface Process {
  id: number;
  name: string;
  description: string;
}

const WageLogPage: React.FC = () => {
  const actionRef = useRef<any>(null);
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [dataSource, setDataSource] = useState<WageLog[]>([]);   //工资记录数据
  //const [specModels, setSpecModels] = useState<SpecModel[]>([]);
  const [allSpecModels, setAllSpecModels] = useState<SpecModel[]>([]);

  // 搜索条件状态
  const [filterWorker, setFilterWorker] = useState<string>();
  const [filterProcess, setFilterProcess] = useState<string>();
  const [filterDate, setFilterDate] = useState<string>();

  // 根据搜索条件过滤数据
  const filteredData = useMemo(() => {
    return dataSource.filter((item) => {
      const matchWorker = !filterWorker || item.worker === filterWorker;
      const matchProcess = !filterProcess || item.process === filterProcess;
      const matchDate = !filterDate || item.date === filterDate;
      return matchWorker && matchProcess && matchDate;
    });
  }, [dataSource, filterWorker, filterProcess, filterDate]);

  // 加载工人
  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const res = await getWorkers();
        console.log(res);
        const workersWithProcessName = res.data.workers.map((w: any) => ({
          ...w,
          process_name: w.process.name || '',
        }));
        //console.log(res.data.workers);
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

  //加载所有规格
    useEffect(() => {
      const loadAllSpecModels = async () => {
        const res = await getSpecModels();
        //console.log("所有规格：", res);
        setAllSpecModels(res.specModels);
      };
      loadAllSpecModels();
    }, []);

  // 加载工资记录
  useEffect(() => {
      //加载工资记录
    const loadWageLog = async () => {
      const res = await getWageLogs();
      console.log("工资记录：", res);
      setDataSource(res.wage_logs);
    };
    loadWageLog();
  }, []);

 

  const columns: ProColumns<WageLog>[] = [
    {
      title: '工人姓名',
      dataIndex: 'worker_id',
      valueType: 'select',
      request: async () =>
        workers.map((item) => ({
          label: item.name,
          value: item.id,
        })),
      formItemProps: { rules: [{ required: true }] },
      width: '7%',
      align: 'center', // 设置内容居中
    },   
    
    {
      title: '工序',
      dataIndex: 'process_id',
      valueType: 'select',
      request: async () =>
        processes.map((item) => ({
          label: item.name,
          value: item.id,
        })),
      formItemProps: { rules: [{ required: true }] },
      fieldProps: (form, config) => ({
        onChange: (value) => {
          const rowKey = config?.rowKey;
          if (rowKey && form) {
            form.setFieldsValue({
              [rowKey]: {
                process_id: value,
                spec_model_id: undefined, // 清空规格型号
              },
            });
          }
        },
      }),
      align: 'center', 
    },
    {
      title: '规格型号',
      dataIndex: 'spec_model_id',
      valueType: 'select',
      formItemProps: { rules: [{ required: true }] },
      dependencies: ['process_id'],
      fieldProps: (form, config) => {
        const rowKey = config?.rowKey;
        const processId = form?.getFieldValue?.([rowKey, 'process_id']);
        const options = allSpecModels
          .filter((item) => item.process_id === processId)
          .map((item) => ({
            label: item.name,
            value: item.id,
          }));
    
          return {
            options,
            onChange: (value: number) => {
              const spec = allSpecModels.find((item) => item.id === value);
              if (spec) {
                const rowKey = String(config.rowKey);
                const quantity = form?.getFieldValue?.([rowKey, 'quantity']) ?? 0;
                const total = parseFloat((spec.price * quantity).toFixed(2));
          
                form?.setFieldsValue({
                  [rowKey]: {
                    actual_price: spec.price,
                    total_wage: total,
                  },
                });
              }
            },
          };
      },
      render: (_, record) => {
        const spec = allSpecModels.find((item) => item.id === Number(record.spec_model_id));
        return spec ? spec.name : '-';
      },
      align: 'center', 
    },
    {
      title: '工价',
      dataIndex: 'actual_price',
      valueType: 'digit',
      formItemProps: { rules: [{ required: true }] },
      fieldProps: (form, config) => {
        const rowKey = String(config?.rowKey); // 强制转成字符串，避免 TS 报错
        return {
          onChange: (value: number) => {
            const quantity = form?.getFieldValue?.([rowKey, 'quantity']) || 0;
            const total = parseFloat((value * quantity).toFixed(2));
            form?.setFieldsValue?.({
              [rowKey]: {
                total_wage: total,
              },
            });
          },
        };
      },
      align: 'center', 
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      valueType: 'digit',
      formItemProps: { rules: [{ required: true }] },
      fieldProps: (form, config) => {
        const rowKey = String(config?.rowKey); // 强制转成字符串，避免 TS 报错
        return {
          onChange: (value: number) => {
            const quantity = form?.getFieldValue?.([rowKey, 'actual_price']) || 0;
            const total = parseFloat((value * quantity).toFixed(2));
            form?.setFieldsValue?.({
              [rowKey]: {
                total_wage: total,
              },
            });
          },
        };
      },
      align: 'center', 
    },
    /** 
    {
      title: '组人数',
      dataIndex: 'group_size',
      valueType: 'digit',
      formItemProps: { rules: [{ required: true }] },
    },*/
    {
      title: '工资',
      dataIndex: 'total_wage',
      valueType: 'digit',
      renderText: (_: any, row: WageLog) =>
        (row.actual_price * row.quantity).toFixed(2),
      align: 'center', 
    },
    {
      title: '日期',
      dataIndex: 'date',
      valueType: 'date',
      initialValue: dayjs().format('YYYY-MM-DD'),
      align: 'center', 
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
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a
          key="editable"
          onClick={() => {
            actionRef.current?.startEditable?.(record.id);
          }}
        >
          编辑
        </a>,
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
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
          options={processes}
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
            console.log("编辑表存时record数据:", record);
            const updatedRow = {
              ...record,
            };
            const newData = [...dataSource];
            const index = newData.findIndex((item) => item.id === record.id);
            if (index > -1) {//如果是编辑数据
              const updateToDatabase = {
                id: updatedRow.id,
                worker_id: updatedRow.worker_id,
                process_id: updatedRow.process_id,
                spec_model_id: updatedRow.spec_model_id,
                date: updatedRow.date,
                actual_price: updatedRow.actual_price,
                quantity: updatedRow.quantity,
                total_wage: updatedRow.total_wage,
                remark: updatedRow.remark
                //created_at?: string;
                //updated_at?: string;
              }
              updateWageLog(updateToDatabase.id, updateToDatabase);
              newData[index] = updatedRow;
            } else {//如果是新增数据
              const addToDatabase = {
                //id: updatedRow.id,
                worker_id: updatedRow.worker_id,
                process_id: updatedRow.process_id,
                spec_model_id: updatedRow.spec_model_id,
                date: updatedRow.date,
                actual_price: updatedRow.actual_price,
                quantity: updatedRow.quantity,
                total_wage: updatedRow.total_wage,
                remark: updatedRow.remark
                
              }
              createWageLog(addToDatabase);
              newData.push(updatedRow);
            }
            
            //updateWageLog(updateToDatabase.id, updateToDatabase);
            setDataSource(newData);
            notification.success({ message: '保存成功' });
          },
        }}
        recordCreatorProps={{
          record: () => ({
            id: Date.now(),
            worker: '',
            worker_id:0,
            process: '',
            process_id: 0,
            //spec_model: '',
            spec_model_id: 0,
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
