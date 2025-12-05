import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm } from 'antd';
import axios from 'axios';

// -------------------------------
// 类型定义
// -------------------------------
interface Company {
  id: number;
  name: string;
  description?: string;
  remark?: string;
}

// -------------------------------
// 公司管理组件
// -------------------------------
const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form] = Form.useForm();

  // -------------------------------
  // 获取公司列表
  // -------------------------------
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ success: boolean; data: Company[]; message?: string }>('/api/company/list');
      if (res.data.success) {
        setCompanies(res.data.data);
      } else {
        message.error(res.data.message || '获取公司列表失败');
      }
    } catch (error) {
      message.error('获取公司列表异常');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // -------------------------------
  // 打开创建/编辑弹窗
  // -------------------------------
  const openModal = (company: Company | null = null) => {
    setEditingCompany(company);
    setIsModalVisible(true);
    if (company) {
      form.setFieldsValue(company);
    } else {
      form.resetFields();
    }
  };

  // -------------------------------
  // 提交表单（创建或更新）
  // -------------------------------
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCompany) {
        const res = await axios.put<{ success: boolean; message?: string }>(`/api/company/${editingCompany.id}`, values);
        if (res.data.success) {
          message.success('更新成功');
        } else {
          message.error(res.data.message || '更新失败');
        }
      } else {
        const res = await axios.post<{ success: boolean; message?: string }>('/api/company/create', values);
        if (res.data.success) {
          message.success('创建成功');
        } else {
          message.error(res.data.message || '创建失败');
        }
      }
      setIsModalVisible(false);
      fetchCompanies();
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------
  // 删除公司
  // -------------------------------
  const handleDelete = async (id: number) => {
    try {
      const res = await axios.delete<{ success: boolean; message?: string }>(`/api/company/${id}`);
      if (res.data.success) {
        message.success('删除成功');
        fetchCompanies();
      } else {
        message.error(res.data.message || '删除失败');
      }
    } catch (error) {
      message.error('删除异常');
    }
  };

  return (
    <div>
      <Button type="primary" onClick={() => openModal()} style={{ marginBottom: 16 }}>
        新建公司
      </Button>

      <Table dataSource={companies} rowKey="id" loading={loading}>
        <Table.Column title="ID" dataIndex="id" />
        <Table.Column title="公司名称" dataIndex="name" />
        <Table.Column title="描述" dataIndex="description" />
        <Table.Column title="备注" dataIndex="remark" />
        <Table.Column
          title="操作"
          render={(_, record: Company) => (
            <>
              <Button type="link" onClick={() => openModal(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确定要删除吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="是"
                cancelText="否"
              >
                <Button type="link" danger>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        />
      </Table>

      <Modal
        title={editingCompany ? '编辑公司' : '新建公司'}
        visible={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="公司名称"
            name="name"
            rules={[{ required: true, message: '请输入公司名称' }]}
          >
            <Input placeholder="请输入公司名称" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea placeholder="请输入描述" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea placeholder="备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CompanyManagement;
