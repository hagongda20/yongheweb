import { Menu } from "antd";
import {
  UserOutlined,
  AppstoreOutlined,
  DollarOutlined,
  FileTextOutlined,
  SearchOutlined,
  UploadOutlined,
  TeamOutlined,
  SettingOutlined,
  BankOutlined,
  SolutionOutlined,
  SwapOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const selectedKey = location.pathname;

  // 从本地获取用户角色
  const userRoles: string[] = JSON.parse(localStorage.getItem("roles") || "[]");

  // 判断是否有权限
  const hasPermission = (itemRoles?: string[]) => {
    if (!itemRoles || itemRoles.length === 0) return true; // 默认可见
    return itemRoles.some(role => userRoles.includes(role));
  };

  // 菜单配置
  const menuItems = [
    {
      key: "salary-group",
      icon: <TeamOutlined />,
      label: "工资管理",
      children: [
        { key: "/workers", icon: <UserOutlined />, label: <Link to="/workers">工人信息</Link>, roles: [] },
        { key: "/processes", icon: <AppstoreOutlined />, label: <Link to="/processes">工序调整</Link>, roles: [] },
        { key: "/spec-models", icon: <DollarOutlined />, label: <Link to="/spec-models">规格工价</Link>, roles: [] },
        { key: "/wage_logs", icon: <FileTextOutlined />, label: <Link to="/wage_logs">日薪录入</Link>, roles: [] },
        { key: "/wage_logs_check", icon: <SearchOutlined />, label: <Link to="/wage_logs_check">工资查询</Link>, roles: [] },
        { key: "/salary_import", icon: <UploadOutlined />, label: <Link to="/salary_import">薪资导入</Link>, roles: [] },
      ],
    },
    {
      key: "company-group",
      icon: <BankOutlined />,
      label: "往来账管理",
      children: [
        { key: "/company", icon: <SolutionOutlined />, label: <Link to="/company">公司管理</Link>, roles: [] },
        { key: "/company_account", icon: <BankOutlined />, label: <Link to="/company_account">公司账户</Link>, roles: [] },
        { key: "/customer", icon: <UserOutlined />, label: <Link to="/customer">客户管理</Link>, roles: [] },
        { key: "/customer_account", icon: <SettingOutlined />, label: <Link to="/customer_account">客户账户</Link>, roles: [] },
        { key: "/customer_balance", icon: <DollarOutlined />, label: <Link to="/customer_balance">客户余额</Link>, roles: [] },
        { key: "/transaction", icon: <SwapOutlined />, label: <Link to="/transaction">转账流水</Link>, roles: [] },
      ],
    },
    {
      key: "users-group",
      icon: <UserOutlined />,
      label: "用户管理",
      //roles: ["管理员"] ,// ⭐ 仅管理员可见
      children: [
        { key: "/login", icon: <LoginOutlined />, label: <Link to="/login">登录注册</Link>, roles: [] },
        { 
          key: "/auditUser", 
          icon: <LoginOutlined />, 
          label: <Link to="/registerList">注册审核</Link>, 
          roles: ["管理员"] // ⭐ 仅管理员可见
        },
      ],
    },
  ];

  // 过滤没有权限的菜单
  const filteredItems = menuItems.map(group => ({
    ...group,
    children: group.children?.filter(item => hasPermission(item.roles)) || [],
  }));

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        overflowY: "auto",
        width: 200,
        zIndex: 1000,
      }}
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={["salary-group", "company-group"]}
        items={filteredItems}
      />
    </div>
  );
};

export default Sidebar;
