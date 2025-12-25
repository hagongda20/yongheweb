// src/pages/users/Register.tsx
import React from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import axios from 'axios';

const Register: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      await axios.post('/api/register', {
        username: values.username,
        password: values.password,
        real_name: values.real_name,
        phone: values.phone,
        remark: values.remark,
      });

      message.success('注册成功，请等待管理员审核');
      form.resetFields();
    } catch (e: any) {
      message.error(e?.response?.data?.msg || '注册失败');
    }
  };

  return (
    <Card title="用户注册" style={{ width: 420, margin: '60px auto' }}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="姓名"
          name="real_name"
          rules={[{ required: true, message: '请输入姓名' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="手机号" name="phone">
          <Input />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="确认密码"
          name="confirm"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || value === getFieldValue('password')) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item label="备注" name="remark">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Button type="primary" htmlType="submit" block>
          提交注册
        </Button>
      </Form>
    </Card>
  );
};

export default Register;
