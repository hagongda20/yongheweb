import React from 'react';
import { Worker } from '../../services/workers';
import { Table, Button, Space } from 'antd';

interface Props {
  workers: Worker[];
  onEdit: (worker: Worker) => void;
  onDelete: (id: number) => void;
}

const WorkerList: React.FC<Props> = ({ workers, onEdit, onDelete }) => {
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '身份证',
      dataIndex: 'id_card',
      key: 'id_card',
    },
    {
      title: '分组',
      dataIndex: 'group',
      key: 'group',
    },
   
    {
      title: '所属工序',
      dataIndex: ['process', 'name'],  // 这里取关联的工序名字
      key: 'process_name',
      render: (text: string) => text || '-', // 如果没有工序显示 -
    },
    {
      title: '入职时间',
      dataIndex: 'entry_date',
      key: 'entry_date',
      valueType: 'text',
    },
    {
      title: '离职时间',
      dataIndex: 'leave_date',
      key: 'leave_date',
      render: (text: string | null) => text ? text : '-',
    },
    {
      title: '是否在职',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Worker) => (
        <Space>
          <Button type="link" onClick={() => onEdit(record)}>编辑</Button>
          {/** 
          <Button type="link" danger onClick={() => onDelete(record.id)}>删除</Button>*/}
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={workers}
      columns={columns}
      rowKey="id"
      pagination={false}  // 去掉分页功能
    />
  );
};

export default WorkerList;
