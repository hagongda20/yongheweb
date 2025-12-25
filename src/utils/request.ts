import axios from 'axios';
import { message } from 'antd';
import { getToken, removeToken } from './auth';

const request = axios.create({
  baseURL: 'http://localhost:3000', // 后端地址
  timeout: 5000,
});

// 请求拦截：自动加 token
request.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截：统一处理未登录
request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      message.warning(error.response.data?.msg || '登录已过期，请重新登录');
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default request;
