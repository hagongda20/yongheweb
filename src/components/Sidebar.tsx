import { Menu } from 'antd';
import {
  UserOutlined,
  AppstoreOutlined,
  SearchOutlined,
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
          icon: <DollarOutlined />,
          label: <Link to="/spec-models">规格工价</Link>,
        },
        
        {
          key: '/wage_logs',
          icon: <FileTextOutlined />,
          label: <Link to="/wage_logs">日薪录入</Link>,
        },
        {
          key: '/wage_logs_check',
          icon: <SearchOutlined />,
          label: <Link to="/wage_logs_check">工资查询</Link>,
        },
      ]}
    />
  );
};

export default Sidebar;
