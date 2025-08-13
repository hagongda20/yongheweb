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
    <div
      style={{
        position: 'fixed',   // 固定定位
        top: 0,               // 顶部对齐
        left: 0,              // 左侧对齐
        height: '100vh',      // 占满屏幕高度
        overflowY: 'auto',    // 如果菜单太长可以滚动
        width: 200,           // 固定宽度
        zIndex: 1000,         // 保证在上层
      }}
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        style={{ height: '100%' }} // 让 Menu 高度自适应父容器
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
          {
            key: '/salary_import',
            icon: <SearchOutlined />,
            label: <Link to="/salary_import">薪资导入</Link>,
          },
        ]}
      />
    </div>
  );
};

export default Sidebar;
