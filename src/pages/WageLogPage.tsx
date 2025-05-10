import {
  EditableProTable,
  ProColumns,
  ProFormSelect,
} from '@ant-design/pro-components';
import { DatePicker, notification } from 'antd';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { getWorkersBySearchDate } from '../services/workers';
import { getProcesses } from '../services/processes';
import { getSpecModels } from '../services/specModel';
import { updateWageLog, createWageLog, deleteWageLog, getWageLogById, getWageLogsByDate } from '../services/wageLogs';
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
  actual_group_size: number;
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
  entry_date:string;
  leave_date:string;
  status: string;
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
  const [allSpecModels, setAllSpecModels] = useState<SpecModel[]>([]);

  // 搜索条件状态
  const [filterWorker, setFilterWorker] = useState<number>();
  const [filterProcess, setFilterProcess] = useState<number>();
  const [filterDate, setFilterDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

  // 根据搜索条件过滤数据
  const filteredData = useMemo(() => {
    return dataSource.filter((item) => {
      const matchWorker = !filterWorker || item.worker_id === filterWorker;
      const matchProcess = !filterProcess || item.process_id === filterProcess;
      const matchDate = !filterDate || item.date === filterDate;
      return matchWorker && matchProcess && matchDate;
    });
  }, [dataSource, filterWorker, filterProcess, filterDate]);

  // 加载工人  加载所有在查询日期里没有离职的工人
  useEffect(() => {
    const loadWorkers = async () => {
      try {
        //const res = await getWorkers();
        const res = await getWorkersBySearchDate(filterDate);
        //console.log('res:',res);
        const workersWithProcessName = res.workers.map((w: any) => ({
          ...w,
          process_name: w.process.name || '',
          process_id: w.process.id || '',
        }));
        console.log("所有工人记录：", workersWithProcessName);
        setWorkers(workersWithProcessName);
        
      } catch (error) {
        console.error('加载工人失败:', error);
      }
    };
    loadWorkers();
  }, [filterDate]);

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
    if (workers.length === 0) return;
    const loadWageLog = async () => {
      
      const wageRes = await getWageLogsByDate(filterDate);
      const wageLogs: WageLog[] = wageRes.wage_logs || [];
      // 获取已有工资记录的工人 ID 集合
      const recordedWorkerIds = new Set<number>(
        wageLogs.map((log: WageLog) => log.worker_id)
      );
  
      //const today = dayjs().format('YYYY-MM-DD');
      // 创建未记录工人的空记录
      const missingLogs: WageLog[] = workers
        .filter((worker: Worker) => !recordedWorkerIds.has(worker.id))
        .map((worker: Worker) => ({
          id: Date.now() + worker.id, // 确保唯一
          isNew: true,
          worker_id: worker.id,
          worker:worker.name,
          process_id: worker.process_id,
          process:worker.process_name,
          spec_model_id: 0,
          spec_model:'',
          actual_price: 0,
          actual_group_size: 1,
          quantity: 0,
          group_size: 1,
          total_wage: 0,
          date: filterDate,
          remark: '',
        }));
      console.log("补足不在工资记录上的工人后的信息:", [...wageLogs, ...missingLogs]);  
      setDataSource([...wageLogs, ...missingLogs]);
    };
  
    loadWageLog();
  }, [workers]);
  

 

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
      fieldProps: (form, config) => ({
        showSearch: true,
        filterOption: (input: string, option: { label: any; }) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
        onChange: (value) => {
          const rowKey = config?.rowKey;
          const worker = workers.find((item) => item.id === Number(value));
          if (rowKey && form) {
            form.setFieldsValue({
              [rowKey]: {
                worker_id: value,
                process_id: worker?.process_id,
                //spec_model_id: undefined, // 清空规格型号
              },
            });
          }
        },
      }),
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
        showSearch: true,
        filterOption: (input: string, option: { label: any; }) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
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
            showSearch: true,
            filterOption: (input: string, option: { label: any; }) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
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
            const actual_group_size = form?.getFieldValue?.([rowKey, 'actual_group_size']) || 0;
            const total = parseFloat((value * quantity / actual_group_size).toFixed(2));
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
            const actual_price = form?.getFieldValue?.([rowKey, 'actual_price']) || 0;
            const actual_group_size = form?.getFieldValue?.([rowKey, 'actual_group_size']) || 0;
            const total = parseFloat((value * actual_price / actual_group_size).toFixed(2));
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
      title: '组人数',
      dataIndex: 'actual_group_size',
      valueType: 'digit',
      formItemProps: { rules: [{ required: true }] },
      fieldProps: (form, config) => {
        const rowKey = String(config?.rowKey); // 强制转成字符串，避免 TS 报错
        return {
          onChange: (value: number) => {
            const actual_price = form?.getFieldValue?.([rowKey, 'actual_price']) || 0;
            const quantity = form?.getFieldValue?.([rowKey, 'quantity']) || 0;
            const total = parseFloat((actual_price * quantity / value).toFixed(2));
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
      ///renderText: (_: any, row: WageLog) =>
       // (row.actual_price * row.quantity/ row.actual_group_size).toFixed(2),
      align: 'center', 
    },
    {
      title: '日期',
      dataIndex: 'date',
      valueType: 'date',
      initialValue: filterDate,
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
          onClick={async () => {
            let hasRecord = false;
            try {
              await getWageLogById(record.id);
              hasRecord = true;
            } catch (error: any) {
              if (error.response && error.response.status === 404) {
                hasRecord = false;
              } else {
                notification.error({ message: '查询工资记录失败' });
                return;
              }
            }
            if(hasRecord)
              deleteWageLog(record.id);
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
      <div style={{ marginBottom: 26, display: 'flex', gap: 16, alignItems: 'center' }}>
        <ProFormSelect
          name="worker"
          label="工人"
          options={workers.map(item => ({
            label: item.name,
            value: item.id,
          }))}
          fieldProps={{
            showSearch: true, // 开启搜索
            optionFilterProp: 'label', // 允许根据 label 过滤
            value: filterWorker,
            onChange: setFilterWorker,
            allowClear: true,
          }}
          style={{ width: 200 }}
          formItemProps={{
            style: { marginBottom: 0 }, // 去掉下边距
          }}
        />
        <ProFormSelect
          name="process"
          label="工序"
          options={processes.map(item => ({
            label: item.name,
            value: item.id,
          }))}
          fieldProps={{
            showSearch: true, // 开启搜索
            optionFilterProp: 'label', // 允许根据 label 过滤
            value: filterProcess,
            onChange: setFilterProcess,
            allowClear: true,
          }}
          style={{ width: 200 }}
          formItemProps={{
            style: { marginBottom: 0 }, // 去掉下边距
          }}
        />
        <DatePicker
          style={{ width: 200 }}  // 设置固定宽度，避免过长
          placeholder="选择日期"

          value={dayjs(filterDate)}
          onChange={(_, dateString) => {
            if (typeof dateString === 'string') setFilterDate(dateString);
          }}
        />
      </div>



      <EditableProTable<WageLog>
        //headerTitle="工资记录"
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
            
            let hasRecord = false;
            try {
              await getWageLogById(record.id);
              hasRecord = true;
            } catch (error: any) {
              if (error.response && error.response.status === 404) {
                hasRecord = false;
              } else {
                notification.error({ message: '查询工资记录失败' });
                return;
              }
            }

            if (index > -1 && hasRecord) {//如果是编辑数据
              const updateToDatabase = {
                id: updatedRow.id,
                worker_id: updatedRow.worker_id,
                process_id: updatedRow.process_id,
                spec_model_id: updatedRow.spec_model_id,
                date: updatedRow.date,
                actual_price: updatedRow.actual_price,
                actual_group_size: updatedRow.actual_group_size,
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
                actual_group_size: updatedRow.actual_group_size,
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
          position: 'top',
          record: () => ({
            id: Date.now(),
            worker: '',
            worker_id:0,
            process: '',
            process_id: 0,
            //spec_model: '',
            spec_model_id: 0,
            actual_price: 0,
            actual_group_size: 1,
            quantity: 0,
            group_size: 1,
            total_wage: 0,
            date: filterDate,
            remark: '',
          }),
        }}
      />
    </>
  );
};

export default WageLogPage;
