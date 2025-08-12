import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Form, Input, Select, Button, Space, message, DatePicker, Radio } from 'antd';
import { getProcesses } from '../../services/processes';
import dayjs from 'dayjs';

const { Option } = Select;

interface WorkerFormProps {
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const WorkerForm: React.FC<WorkerFormProps> = ({ initialData, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [processes, setProcesses] = useState<{ id: number, name: string }[]>([]);

  // 加载工序
  useEffect(() => {
    const loadProcesses = async () => {
      try {
        const res = await getProcesses();
        setProcesses(res.processes);
      } catch (error) {
        console.error('加载工序失败:', error);
      }
    };
    loadProcesses();
  }, []);

  useEffect(() => {
    if (initialData) {
      const newData = {
        ...initialData,
        entry_date: initialData.entry_date ? dayjs(initialData.entry_date) : null,
        leave_date: initialData.leave_date ? dayjs(initialData.leave_date) : null,
      };
      form.setFieldsValue(newData);
    } else {
      form.setFieldsValue({ status: '在职' }); // ✅ 设置默认状态为“在职”
      form.resetFields();
    }
  }, [initialData, form]);

  const status = Form.useWatch('status', form); // ✅ 监听状态变化

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        entry_date: values.entry_date ? values.entry_date.format('YYYY-MM-DD') : null,
        leave_date: values.leave_date ? values.leave_date.format('YYYY-MM-DD') : null,
      };
      await onSave(payload);
      form.resetFields();
    } catch (err: any) {
      if (err.errorFields) {
        message.error('请填写完整信息');
      }
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Form layout="vertical" form={form}>
      <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
        <Input />
      </Form.Item>

      <Form.Item name="process_id" label="所属工序" rules={[{ required: true, message: '请选择工序' }]}>
        <Select placeholder="请选择工序">
          {processes.map(proc => (
            <Option key={proc.id} value={proc.id}>{proc.name}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="id_card" label="身份证号">
        <Input />
      </Form.Item>

      <Form.Item name="group" label="小组">
        <Input />
      </Form.Item>

      <Form.Item name="entry_date" label="入职日期" rules={[{ required: true, message: '请选择入职日期' }]}>
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      {/* ✅ 状态控制显示离职时间 */}
      {status === '离职' && (
        <Form.Item name="leave_date" label="离职日期">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      )}

      <Form.Item name="status" label="状态" initialValue="在职">
        <Radio.Group>
          <Radio value="在职">在职</Radio>
          <Radio value="离职">离职</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item name="remark" label="备注">
        <Input />
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
