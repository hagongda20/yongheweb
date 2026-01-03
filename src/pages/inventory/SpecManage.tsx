import { useEffect, useState } from 'react';
import {
  Card,
  List,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message
} from 'antd';
import request from '../../utils/request';

/* =======================
 * 类型定义
 * ======================= */
interface SpecOption {
  id: number;
  value: string;
}

interface SpecCategory {
  id: number;
  code: string;
  name: string;
  options: SpecOption[];
}

type ModalType = 'category' | 'option' | null;

const SpecManage = () => {
  /* =======================
   * 状态
   * ======================= */
  const [categories, setCategories] = useState<SpecCategory[]>([]);
  const [currentCategory, setCurrentCategory] =
    useState<SpecCategory | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingRecord, setEditingRecord] =
    useState<SpecCategory | SpecOption | null>(null);

  const [form] = Form.useForm();

  /* =======================
   * 加载数据（⚠️ 无依赖）
   * ======================= */
  const loadSpecs = async () => {
    const res = await request.get('/api/inventory/spec/list');
    const list: SpecCategory[] = res.data?.data || [];
    setCategories(list);
  };

  /* 初始加载 */
  useEffect(() => {
    loadSpecs();
  }, []);

  /* categories 变化时，同步 currentCategory */
  useEffect(() => {
    if (!categories.length) {
      setCurrentCategory(null);
      return;
    }

    if (!currentCategory) {
      setCurrentCategory(categories[0]);
      return;
    }

    const updated = categories.find(c => c.id === currentCategory.id);
    setCurrentCategory(updated || categories[0]);
  }, [categories]);

  /* =======================
   * 分类操作
   * ======================= */
  const addCategory = () => {
    setEditingRecord(null);
    setModalType('category');
    form.resetFields();
    setModalOpen(true);
  };

  const editCategory = (record: SpecCategory) => {
    setEditingRecord(record);
    setModalType('category');
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const disableCategory = async (id: number) => {
    await request.post('/api/inventory/spec/category/disable', { id });
    message.success('已停用');
    loadSpecs();
  };

  /* =======================
   * 选项操作
   * ======================= */
  const addOption = () => {
    if (!currentCategory) return;
    setEditingRecord(null);
    setModalType('option');
    form.resetFields();
    setModalOpen(true);
  };

  const editOption = (record: SpecOption) => {
    setEditingRecord(record);
    setModalType('option');
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const disableOption = async (id: number) => {
    await request.post('/api/inventory/spec/option/disable', { id });
    message.success('已停用');
    loadSpecs();
  };

  /* =======================
   * 提交弹窗
   * ======================= */
  const handleOk = async () => {
    const values = await form.validateFields();

    if (modalType === 'category') {
      if (editingRecord) {
        await request.post('/api/inventory/spec/category/update', {
          id: (editingRecord as SpecCategory).id,
          ...values
        });
      } else {
        await request.post('/api/inventory/spec/category/add', values);
      }
    }

    if (modalType === 'option' && currentCategory) {
      if (editingRecord) {
        await request.post('/api/inventory/spec/option/update', {
          id: (editingRecord as SpecOption).id,
          ...values
        });
      } else {
        await request.post('/api/inventory/spec/option/add', {
          category_id: currentCategory.id,
          ...values
        });
      }
    }

    message.success('操作成功');
    setModalOpen(false);
    loadSpecs();
  };

  /* =======================
   * 渲染
   * ======================= */
  return (
    <>
      <Space align="start" style={{ width: '100%' }}>
        {/* 左侧：规格分类 */}
        <Card
          title="规格分类"
          style={{ width: 320 }}
          extra={
            <Button type="primary" onClick={addCategory}>
              新增
            </Button>
          }
        >
          <List
            dataSource={categories}
            renderItem={(item) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  background:
                    currentCategory?.id === item.id ? '#f5f5f5' : undefined
                }}
                onClick={() => setCurrentCategory(item)}
                actions={[
                  <Button key="edit" type="link" onClick={() => editCategory(item)}>
                    编辑
                  </Button>,
                  <Button
                    key="disable"
                    type="link"
                    danger
                    onClick={() => disableCategory(item.id)}
                  >
                    停用
                  </Button>
                ]}
              >
                {item.name}
              </List.Item>
            )}
          />
        </Card>

        {/* 右侧：规格选项 */}
        <Card
          title={`规格选项（${currentCategory?.name || ''}）`}
          style={{ flex: 1 }}
          extra={
            currentCategory && (
              <Button type="primary" onClick={addOption}>
                新增
              </Button>
            )
          }
        >
          <List
            dataSource={currentCategory?.options || []}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button key="edit" type="link" onClick={() => editOption(item)}>
                    编辑
                  </Button>,
                  <Button
                    key="disable"
                    type="link"
                    danger
                    onClick={() => disableOption(item.id)}
                  >
                    停用
                  </Button>
                ]}
              >
                {item.value}
              </List.Item>
            )}
          />
        </Card>
      </Space>

      {/* 弹窗 */}
      <Modal
        open={modalOpen}
        destroyOnClose
        title={
          modalType === 'category'
            ? editingRecord
              ? '编辑规格分类'
              : '新增规格分类'
            : editingRecord
            ? '编辑规格选项'
            : '新增规格选项'
        }
        onCancel={() => setModalOpen(false)}
        onOk={handleOk}
      >
        <Form form={form} layout="vertical">
          {modalType === 'category' && (
            <>
              {!editingRecord && (
                <Form.Item
                  name="code"
                  label="规格编码"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              )}
              <Form.Item
                name="name"
                label="规格名称"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </>
          )}

          {modalType === 'option' && (
            <Form.Item
              name="value"
              label="规格值"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
};

export default SpecManage;
