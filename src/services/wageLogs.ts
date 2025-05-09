import axios from 'axios';

// WageLog 类型定义
export interface WageLog {
  id: number;
  worker_id: number;
  process_id: number;
  spec_model_id: number;
  date: string;
  actual_price: number;
  actual_group_size: number;
  quantity: number;
  total_wage: number;
  remark?: string;
  created_at?: string;
  updated_at?: string;
}

// 获取所有工资记录
export const getWageLogs = async () => {
  try {
    const response = await axios.get('/api/wage_logs/');
    return response.data; // 假设返回的数据包含 'wage_logs' 字段
  } catch (error) {
    console.error('加载工资记录失败:', error);
    throw error;
  }
};

// 获取指定工序和规格型号的工价
export const getWagePriceByProcessAndSpec = async (processId: number, specModelId: number) => {
  try {
    const response = await axios.get(`/api/wage_price/${processId}/${specModelId}`);
    return response.data; // 假设返回的数据包含 'wage_price' 字段
  } catch (error) {
    console.error('获取工价失败:', error);
    throw error;
  }
};

// 创建新的工资记录
export const createWageLog = async (wageLogData: Omit<WageLog, 'id'>) => {
  try {
    console.log('wageLogData:',wageLogData);
    const response = await axios.post('/api/wage_logs/', wageLogData);
    return response.data; // 假设返回的是创建成功的工资记录
  } catch (error) {
    console.error('保存工资记录失败:', error);
    throw error;
  }
};

// 更新工资记录
export const updateWageLog = async (id: number, wageLogData: WageLog) => {
  try {
    const response = await axios.put(`/api/wage_logs/${id}`, wageLogData);
    return response.data; // 假设返回的是更新后的工资记录
  } catch (error) {
    console.error('更新工资记录失败:', error);
    throw error;
  }
};

// 删除工资记录
export const deleteWageLog = async (id: number) => {
  try {
    const response = await axios.delete(`/api/wage_logs/${id}`);
    return response.data; // 假设返回的是删除结果
  } catch (error) {
    console.error('删除工资记录失败:', error);
    throw error;
  }
};

// 获取指定 ID 的工资记录
export const getWageLogById = async (id: number) => {
  try {
    const response = await axios.get(`/api/wage_logs/${id}`);
    return response.data; // 假设后端返回的是一个 WageLog 对象
  } catch (error) {
    console.error('获取工资记录失败:', error);
    throw error;
  }
};

// 根据指定日期获取工资记录
export const getWageLogsByDate = async (date: string) => {
  try {
    const response = await axios.get('/api/wage_logs/', {
      params: { date }, // 假设后端通过 query 参数 ?date=yyyy-mm-dd 来筛选
    });
    return response.data; // 返回的数据结构应与 getWageLogs 相同
  } catch (error) {
    console.error(`加载 ${date} 的工资记录失败:`, error);
    throw error;
  }
};

// 日期区间、工人、工序联合查询
export const getFilteredWageLogs = async (params: {
  start_date?: string;
  end_date?: string;
  worker_id?: number | string;
  process_id?: number | string;
  //page?: number;
  //page_size?: number;
}) => {
  const response = await axios.get('/api/wage_logs/query', { params });
  return response.data;
};