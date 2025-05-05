import axios from 'axios';

export interface Worker {
  id: number;
  name: string;
  id_card?: string;
  remark?: string;
  group?: string;
  process_id?: number;
}

export const getWorkers = () => axios.get<{ workers: Worker[] }>('/api/workers');
export const createWorker = (worker: Partial<Worker>) => axios.post('/api/workers', worker);
export const updateWorker = (id: number, worker: Partial<Worker>) => axios.put(`/api/workers/${id}`, worker);
export const deleteWorker = (id: number) => axios.delete(`/api/workers/${id}`);