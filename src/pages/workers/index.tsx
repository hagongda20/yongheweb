import React, { useEffect, useState } from 'react';
import { Button, Card, Typography, Space, message, Input, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Worker, getWorkers, createWorker, updateWorker, deleteWorker } from '../../services/workers';
import { WorkerForm, WorkerList } from '../../components/workers';

const { Title } = Typography;
const { Search } = Input;

const WorkerPage = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadWorkers = async () => {
    try {
      const res = await getWorkers();
      setWorkers(res.data.workers);
      setFilteredWorkers(res.data.workers); // 初始化搜索结果
    } catch (err) {
      message.error('加载工人信息失败');
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleSave = async (data: Partial<Worker>) => {
    try {
      if (editing) {
        await updateWorker(editing.id, data);
        message.success('更新成功');
      } else {
        await createWorker(data);
        message.success('新增成功');
      }
      setEditing(null);
      setModalVisible(false);
      loadWorkers();
    } catch (err) {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWorker(id);
      message.success('删除成功');
      loadWorkers();
    } catch (err) {
      message.error('删除失败');
    }
  };

  const handleSearch = (value: string) => {
    const filtered = workers.filter((worker) =>
      worker.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredWorkers(filtered);
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={3}>工人信息管理</Title>

        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="请输入姓名搜索"
            onSearch={handleSearch}
            allowClear
            style={{ width: 300 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setModalVisible(true);
            }}
          >
            新增工人
          </Button>
        </Space>

        <WorkerList
          workers={filteredWorkers}
          onEdit={(w) => {
            setEditing(w);
            setModalVisible(true);
          }}
          onDelete={handleDelete}
        />

        <Modal
          title={editing ? '编辑工人' : '新增工人'}
          open={modalVisible}
          footer={null}
          onCancel={() => {
            setEditing(null);
            setModalVisible(false);
          }}
          destroyOnClose
        >
          <WorkerForm
            initialData={editing || undefined}
            onSave={handleSave}
            onCancel={() => {
              setEditing(null);
              setModalVisible(false);
            }}
          />
        </Modal>
      </Space>
    </Card>
  );
};

export default WorkerPage;
