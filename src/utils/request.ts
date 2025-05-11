// utils/request.ts
import axios from 'axios';
import { message } from 'antd';
import { getToken, removeToken } from './auth';

const request = axios.create({
  baseURL: 'http://localhost:3000', // 后端地址，按你实际的写
  timeout: 5000,
});

// 请求前自动附带 token
request.interceptors.request.use((config) => {
const token = getToken();
if (token) {
    config.headers.Authorization = token;
}
return config;
});

// 响应错误统一处理
request.interceptors.response.use(
    (response) => response,
    (error) => {
      console.log("-----------未登录成功-----------");
      if (error.response?.status === 401) {
        message.warning(error.response.data?.msg || '请重新登录');
        removeToken(); // 清除 token
        window.location.href = '/login'; // 跳转登录页面
      }
      return Promise.reject(error);
    }
  );
  

export default request;
