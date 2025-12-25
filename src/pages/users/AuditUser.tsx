import React, { useEffect, useState } from 'react';
import { Table, Button, message, Tag, Modal, Input } from 'antd';
import request from '../../utils/request';

const AuditUser: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectId, setRejectId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/api/users/register/list');
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const approve = async (id: number) => {
    await request.post(`/api/users/register/approve/${id}`);
    message.success('审核通过');
    loadData();
  };

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
          { title: '手机号', dataIndex: 'phone' },
          {
            title: '审核状态',
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
                <>
                  <Button
                    type="link"
                    disabled={disabled}
                    onClick={() => approve(record.id)}
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
                </>
              );
            },
          },
        ]}
      />

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
