import { Menu } from 'antd';
import {
  UserOutlined,
  AppstoreOutlined,
  ProfileOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const selectedKey = location.pathname;

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={[
        {
          key: '/workers',
          icon: <UserOutlined />,
          label: <Link to="/workers">工人信息</Link>,
        },
        {
          key: '/processes',
          icon: <AppstoreOutlined />,
          label: <Link to="/processes">工序调整</Link>,
        },
        {
          key: '/spec-models',
          icon: <ProfileOutlined />,
          label: <Link to="/spec-models">规格型号</Link>,
        },
        {
          key: '/wage-prices',
          icon: <DollarOutlined />,
          label: <Link to="/wage-prices">工价设定</Link>,
        },
        {
          key: '/wage_logs',
          icon: <FileTextOutlined />,
          label: <Link to="/wage_logs">工资记录</Link>,
        },
      ]}
    />
  );
};

export default Sidebar;
