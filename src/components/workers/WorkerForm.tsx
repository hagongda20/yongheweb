import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Form, Input, Select, Button, Space, message } from 'antd';

const { Option } = Select;

interface WorkerFormProps {
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const WorkerForm: React.FC<WorkerFormProps> = ({ initialData, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [processes, setProcesses] = useState<{ id: number, name: string }[]>([]);

  useEffect(() => {
    axios.get('/api/processes/')
      .then(res => {
        setProcesses(res.data.processes || []);
      })
      .catch(err => {
        console.error('Failed to load processes', err);
        message.error('加载工序失败');
      });
  }, []);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
    } else {
      form.resetFields();
    }
  }, [initialData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values);
      form.resetFields(); // 保存成功后，清空表单
    } catch (err: any) {
      if (err.errorFields) {
        message.error('请填写完整信息');
      }
    }
  };

  const handleCancel = () => {
    form.resetFields(); // 取消时也清空
    onCancel();
  };

  return (
    <Form layout="vertical" form={form}>
      <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
        <Input />
      </Form.Item>

      <Form.Item name="id_card" label="身份证号">
        <Input />
      </Form.Item>

      <Form.Item name="remark" label="备注">
        <Input />
      </Form.Item>

      <Form.Item name="group" label="小组">
        <Input />
      </Form.Item>

      <Form.Item name="process_id" label="所属工序" rules={[{ required: true, message: '请选择工序' }]}>
        <Select placeholder="请选择工序">
          {processes.map(proc => (
            <Option key={proc.id} value={proc.id}>{proc.name}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit}>
            保存
          </Button>
          <Button onClick={handleCancel}>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default WorkerForm;
