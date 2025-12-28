import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  message,
  Tag,
  Modal,
  Input,
  Select,
  Space,
} from 'antd';
import request from '../../utils/request';

const { Option } = Select;

const AuditUser: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [approveId, setApproveId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  /* 加载注册用户 */
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/api/users/register/list');
      setData(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  /* 加载可分配角色 */
  const loadRoles = async () => {
    const res = await request.get('/api/users/roles/assignable');
    if (res.data.success) {
      setRoles(res.data.data || []);
    }
  };

  useEffect(() => {
    loadData();
    loadRoles();
  }, []);

  /* 通过审核 */
  const approve = async () => {
    if (!approveId || !selectedRole) {
      message.warning('请选择要分配的角色');
      return;
    }

    await request.post(`/api/users/register/approve/${approveId}`, {
      role_id: selectedRole,
    });

    message.success('审核通过并已分配角色');
    setApproveId(null);
    setSelectedRole(null);
    loadData();
  };

  /* 拒绝 */
  const reject = async () => {
    if (!rejectId || !rejectReason) {
      message.warning('请填写拒绝原因');
      return;
    }

    await request.post(`/api/users/register/reject/${rejectId}`, {
      reason: rejectReason,
    });

    message.success('已拒绝');
    setRejectId(null);
    setRejectReason('');
    loadData();
  };

  return (
    <>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={[
          { title: '用户名', dataIndex: 'username' },
          { title: '姓名', dataIndex: 'real_name' },
          { title: '公司', dataIndex: 'company_name' },
          { title: '手机号', dataIndex: 'phone' },
          {
            title: '状态',
            dataIndex: 'status',
            render: (v: string) => {
              if (v === '待审核') return <Tag color="orange">待审核</Tag>;
              if (v === '已通过') return <Tag color="green">已通过</Tag>;
              return <Tag color="red">已拒绝</Tag>;
            },
          },
          {
            title: '操作',
            render: (_: any, record: any) => {
              const disabled = record.status !== '待审核';
              return (
                <Space>
                  <Button
                    type="link"
                    disabled={disabled}
                    onClick={() => setApproveId(record.id)}
                  >
                    通过
                  </Button>
                  <Button
                    type="link"
                    danger
                    disabled={disabled}
                    onClick={() => setRejectId(record.id)}
                  >
                    拒绝
                  </Button>
                </Space>
              );
            },
          },
        ]}
      />

      {/* ===== 审核通过 + 选角色 ===== */}
      <Modal
        open={approveId !== null}
        title="审核通过并分配角色"
        onOk={approve}
        onCancel={() => {
          setApproveId(null);
          setSelectedRole(null);
        }}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="请选择角色（只能一个）"
          value={selectedRole}
          onChange={setSelectedRole}
        >
          {roles.map((r) => (
            <Option key={r.id} value={r.id}>
              {r.name}
            </Option>
          ))}
        </Select>
      </Modal>

      {/* ===== 拒绝 ===== */}
      <Modal
        open={rejectId !== null}
        title="拒绝原因"
        onOk={reject}
        onCancel={() => setRejectId(null)}
      >
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="请输入拒绝原因"
        />
      </Modal>
    </>
  );
};

export default AuditUser;
