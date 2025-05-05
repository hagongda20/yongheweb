import axios from 'axios';

// 工序接口
export interface Process {
  id: number;
  name: string;
  description: string;
}

// 获取所有工序
export const getProcesses = async () => {
  try {
    const response = await axios.get('/api/processes');
    return response.data;  // 假设返回的数据中包含 processes 数组
  } catch (error) {
    console.error('获取工序列表失败:', error);
    throw error;
  }
};

// 创建一个新的工序
export const createProcess = async (processData: Omit<Process, 'id'>) => {
  try {
    const response = await axios.post('/api/processes', processData);
    return response.data;  // 返回新创建的工序数据
  } catch (error) {
    console.error('创建工序失败:', error);
    throw error;
  }
};

// 更新工序
export const updateProcess = async (id: number, processData: Partial<Process>) => {
  try {
    const response = await axios.put(`/api/processes/${id}`, processData);
    return response.data;  // 返回更新后的工序数据
  } catch (error) {
    console.error('更新工序失败:', error);
    throw error;
  }
};

// 删除工序
export const deleteProcess = async (id: number) => {
  try {
    const response = await axios.delete(`/api/processes/${id}`);
    return response.data;  // 返回删除操作的结果
  } catch (error) {
    console.error('删除工序失败:', error);
    throw error;
  }
};
