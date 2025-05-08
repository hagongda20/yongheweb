import axios from 'axios';

// 工价数据接口
export interface WagePrice {
  id: number;
  price: number;
  is_special: boolean;
  process_id: number;
  spec_model_id: number;
}

// 创建工价
export const createWagePrice = async (data: Omit<WagePrice, 'id'>) => {
  try {
    const response = await axios.post('/api/wageprice', data);
    return response.data;  // 假设返回创建成功的工价数据
  } catch (error) {
    console.error('创建工价失败:', error);
    throw error;
  }
};

// 获取所有工价（可选，根据需要添加）
export const getWagePrices = async () => {
  try {
    const response = await axios.get('/api/wageprice/');
    return response.data;  // 假设返回的数据中包含 wage_prices 数组
  } catch (error) {
    console.error('获取工价失败:', error);
    throw error;
  }
};

// 更新工价
export const updateWagePrice = async (id: number, data: Partial<WagePrice>) => {
  try {
    const response = await axios.put(`/api/wageprice/${id}`, data);
    return response.data;  // 返回更新结果
  } catch (error) {
    console.error('更新工价失败:', error);
    throw error;
  }
};

// 删除工价（可选，根据需要添加）
export const deleteWagePrice = async (id: number) => {
  try {
    const response = await axios.delete(`/api/wageprice/${id}`);
    return response.data;  // 返回删除结果
  } catch (error) {
    console.error('删除工价失败:', error);
    throw error;
  }
};

// 根据工序 ID 获取规格型号（配合 WagePrice 页面）
export const getSpecModelsByProcess = async (processId: number) => {
  try {
    const response = await axios.get(`/api/specmodels/by_process/${processId}`);
    return response.data;  // 假设返回的是 { spec_models: [...] }
  } catch (error) {
    console.error('获取规格型号失败:', error);
    throw error;
  }
};

// 获取指定工序和规格型号的工价
export const getWagePriceByProcessAndSpec = async (processId: number, specModelId: number) => {
    try {
      const response = await axios.get(`/api/wageprice/${processId}/${specModelId}`);
      console.log('wageprice_response:', response);
      return response.data; // 假设返回的数据包含 'wage_price' 字段
    } catch (error) {
      console.error('获取工价失败:', error);
      throw error;
    }
  };
