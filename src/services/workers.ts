import axios from 'axios';

export interface Worker {
  id: number;
  name: string;
  id_card?: string;
  remark?: string;
  group?: string;
  process_id?: number;
  entry_date?: string;
  leave_date?: string;
  status?: string;
}

export const getWorkers = () => axios.get<{ workers: Worker[] }>('/api/workers/');
export const createWorker = (worker: Partial<Worker>) => axios.post('/api/workers/', worker);
export const updateWorker = (id: number, worker: Partial<Worker>) => axios.put(`/api/workers/${id}`, worker);
export const deleteWorker = (id: number) => axios.delete(`/api/workers/${id}`);
// 根据指定日期在岗的工人
export const getWorkersBySearchDate = async (date: string) => {
  try {
    const response = await axios.get<{ workers: Worker[] }>('/api/workers/', {
      params: { date }, // 假设后端通过 query 参数 ?date=yyyy-mm-dd 来筛选
    });
    return response.data; // 返回的数据结构应与 getWageLogs 相同
  } catch (error) {
    console.error(`加载 ${date} 在岗工人失败:`, error);
    throw error;
  }
};