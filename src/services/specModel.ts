import axios from 'axios';

// 规格型号接口
export interface SpecModel {
  id: number;
  name: string;
  category: string;
  process_id: number;
}

// 获取所有规格型号
export const getSpecModels = async () => {
  try {
    const response = await axios.get('/api/specmodels/');
    return response.data; // 假设返回的数据中包含 specModels 数组
  } catch (error) {
    console.error('获取规格型号列表失败:', error);
    throw error;
  }
};

// 创建规格型号（不包括 ID）
export const createSpecModel = async (specData: Omit<SpecModel, 'id'>) => {
  try {
    const response = await axios.post('/api/specmodels', specData);
    return response.data; // 返回创建的规格型号
  } catch (error) {
    console.error('创建规格型号失败:', error);
    throw error;
  }
};

// 更新规格型号（部分字段可更新）
export const updateSpecModel = async (id: number, specData: Partial<SpecModel>) => {
  try {
    const response = await axios.put(`/api/specmodels/${id}`, specData);
    return response.data; // 返回更新后的规格型号
  } catch (error) {
    console.error('更新规格型号失败:', error);
    throw error;
  }
};

// 删除规格型号
export const deleteSpecModel = async (id: number) => {
  try {
    const response = await axios.delete(`/api/specmodels/${id}`);
    return response.data; // 返回删除结果
  } catch (error) {
    console.error('删除规格型号失败:', error);
    throw error;
  }
};


// 获取指定工序下的所有规格型号
export const getSpecModelsByProcess = async (processId: number) => {
    try {
      const response = await axios.get(`/api/specmodels/by_process/${processId}`);
      return response.data; // 假设返回的数据结构是 { spec_models: SpecModel[] }
    } catch (error) {
      console.error('获取指定工序的规格型号失败:', error);
      throw error;
    }
  };
