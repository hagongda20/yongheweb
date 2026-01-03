import { Menu, message } from "antd";
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
  LogoutOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { removeToken } from "../utils/auth";

const { SubMenu } = Menu;

interface MenuItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  roles?: string[];
  onClick?: () => void;
  children?: MenuItem[];
}

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedKey = location.pathname;

  /** 当前用户角色 */
  const userRoles: string[] = JSON.parse(
    localStorage.getItem("roles") || "[]"
  );

  /** 权限判断（不写 roles = 默认有权限） */
  const hasPermission = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return roles.some(role => userRoles.includes(role));
  };

  /** 退出登录 */
  const handleLogout = () => {
    removeToken();
    localStorage.removeItem("roles");
    message.success("已退出登录");
    navigate("/login");
  };

  /** 原始菜单配置（父子都可单独加 roles） */
  const menuItems: MenuItem[] = [
    {
      key: "salary-group",
      label: "工资管理",
      icon: <TeamOutlined />,
      children: [
        {
          key: "/workers",
          label: <Link to="/workers">工人信息</Link>,
          icon: <UserOutlined />,
        },
        {
          key: "/processes",
          label: <Link to="/processes">工序调整</Link>,
          icon: <AppstoreOutlined />,
        },
        {
          key: "/spec-models",
          label: <Link to="/spec-models">规格工价</Link>,
          icon: <DollarOutlined />,
        },
        {
          key: "/wage_logs",
          label: <Link to="/wage_logs">日薪录入</Link>,
          icon: <FileTextOutlined />,
        },
        {
          key: "/wage_logs_check",
          label: <Link to="/wage_logs_check">工资查询</Link>,
          icon: <SearchOutlined />,
        },
        {
          key: "/salary_import",
          label: <Link to="/salary_import">薪资导入</Link>,
          icon: <UploadOutlined />,
        },
      ],
    },
    
    {
      key: "inventory-group",
      label: "库存管理",
      icon: <BankOutlined />,
      children: [
        {
          key: "/inventory/spec",
          label: <Link to="/inventory/spec">规格管理</Link>,
          icon: <SettingOutlined />,
        },
        {
          key: "/inventory/product",
          label: <Link to="/inventory/product">产品管理</Link>,
          icon: <AppstoreOutlined />,
        },
        {
          key: "/inventory/list",
          label: <Link to="/inventory/list">库存维护</Link>,
          icon: <BankOutlined />,
        },
        {
          key: "/inventory/operate",
          label: <Link to="/inventory/operate">出入库操作</Link>,
          icon: <SwapOutlined />,
        },
        {
          key: "/inventory/logs",
          label: <Link to="/inventory/logs">出入库流水</Link>,
          icon: <SwapOutlined />,
        },
        {
          key: "/inventory/check",
          label: <Link to="/inventory/check">库存盘点</Link>,
          icon: <SearchOutlined />,
        },
      ],
    },

    {
      key: "company-group",
      label: "往来账管理",
      icon: <BankOutlined />,
      roles: ["管理员"], // ⭐ 父级权限（可随时删）
      children: [
        {
          key: "/company",
          label: <Link to="/company">公司管理</Link>,
          icon: <SolutionOutlined />,
        },
        {
          key: "/company_account",
          label: <Link to="/company_account">公司账户</Link>,
          icon: <BankOutlined />,
        },
        {
          key: "/customer",
          label: <Link to="/customer">客户管理</Link>,
          icon: <UserOutlined />,
        },
        {
          key: "/customer_account",
          label: <Link to="/customer_account">客户账户</Link>,
          icon: <SettingOutlined />,
        },
        {
          key: "/customer_balance",
          label: <Link to="/customer_balance">客户余额</Link>,
          icon: <DollarOutlined />,
        },
        {
          key: "/transaction",
          label: <Link to="/transaction">转账流水</Link>,
          icon: <SwapOutlined />,
        },
      ],
    },
    {
      key: "users-group",
      label: "用户管理",
      icon: <UserOutlined />,
      //roles: ["管理员"], // ⭐ 父级权限（可随时删）
      children: [
        {
          key: "/registerList",
          label: <Link to="/registerList">注册审核</Link>,
          icon: <UserOutlined />,
          roles: ["管理员"], // ⭐ 子级权限
        },
        {
          key: "logout",
          label: "退出登录",
          icon: <LogoutOutlined />,
          onClick: handleLogout,
        },
      ],
    },
  ];

  /**
   * ⭐⭐ 关键：统一过滤父 + 子
   * - 父没权限 → 不渲染
   * - 子没权限 → 不显示
   * - 子被过滤光 → 父也不显示
   */
  const filteredMenu = menuItems
    .filter(group => hasPermission(group.roles))
    .map(group => {
      const children = (group.children || []).filter(child =>
        hasPermission(child.roles)
      );
      return { ...group, children };
    })
    .filter(group => group.children && group.children.length > 0);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 200,
        height: "100vh",
        overflowY: "auto",
      }}
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={[]} // ⭐ 默认全部折叠
      >
        {filteredMenu.map(group => (
          <SubMenu
            key={group.key}
            icon={group.icon}
            title={group.label}
          >
            {group.children!.map(item => (
              <Menu.Item
                key={item.key}
                icon={item.icon}
                onClick={item.onClick}
              >
                {item.label}
              </Menu.Item>
            ))}
          </SubMenu>
        ))}
      </Menu>
    </div>
  );
};

export default Sidebar;
