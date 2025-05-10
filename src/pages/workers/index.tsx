import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Typography,
  Space,
  message,
  Input,
  Modal,
  Checkbox,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  Worker,
  getWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
} from '../../services/workers';
import { WorkerForm, WorkerList } from '../../components/workers';

const { Title } = Typography;
const { Search } = Input;

const WorkerPage = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(['在职']); // 默认选中“在职”

  const loadWorkers = async () => {
    try {
      const res = await getWorkers();
      setWorkers(res.data.workers);
    } catch (err) {
      message.error('加载工人信息失败');
    }
  };

  useEffect(() => {
    applyFilters(searchKeyword, statusFilter);
  }, [workers, searchKeyword, statusFilter]);

  useEffect(() => {
    loadWorkers();
  }, []);

  const applyFilters = (keyword: string, statuses: string[]) => {
    const filtered = workers.filter((worker) => {
      const matchName =
        worker.name.toLowerCase().includes((keyword || '').toLowerCase());
      // 处理工人状态筛选
      const matchStatus =
        statuses.length === 0 || statuses.includes(worker.status || '');
      return matchName && matchStatus;
    });
    setFilteredWorkers(filtered);
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    applyFilters(value, statusFilter);
  };

  const handleStatusChange = (checked: any[]) => {
    setStatusFilter(checked);
    applyFilters(searchKeyword, checked);
  };

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

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={3}>工人信息管理</Title>

        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="请输入姓名搜索"
            onSearch={handleSearch}
            allowClear
            style={{ width: 300, marginRight: 50 }}
          />
          <Checkbox.Group
            style={{ marginRight: 16 }}
            options={[
              { label: '在职', value: '在职' },
              { label: '离职', value: '离职' },
            ]}
            value={statusFilter}
            onChange={handleStatusChange}
          />
          <Button
            style={{ float: 'right' }}
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
