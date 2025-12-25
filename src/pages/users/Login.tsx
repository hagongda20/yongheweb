// src/pages/users/Login.tsx
import React from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      const res = await axios.post('/api/login', values);
      const user = res.data.user;

      if (user['审核状态'] !== '已通过') {
        message.warning(`账号${user['审核状态']}，无法登录`);
        return;
      }

      localStorage.setItem('token', res.data.token);
      message.success('登录成功');
      navigate('/');
    } catch (e: any) {
      message.error(e?.response?.data?.msg || '登录失败');
    }
  };

  return (
    <Card title="用户登录" style={{ width: 360, margin: '80px auto' }}>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password />
        </Form.Item>

        <Button type="primary" htmlType="submit" block>
          登录
        </Button>

        <Button type="link" block onClick={() => navigate('/register')}>
          没有账号？去注册
        </Button>
      </Form>
    </Card>
  );
};

export default Login;
