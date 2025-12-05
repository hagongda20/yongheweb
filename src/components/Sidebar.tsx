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
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const selectedKey = location.pathname;

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
        items={[
          // =============================
          // 1. 工资管理分组
          // =============================
          {
            key: "salary-group",
            icon: <TeamOutlined />,
            label: "工资管理",
            children: [
              {
                key: "/workers",
                icon: <UserOutlined />,
                label: <Link to="/workers">工人信息</Link>,
              },
              {
                key: "/processes",
                icon: <AppstoreOutlined />,
                label: <Link to="/processes">工序调整</Link>,
              },
              {
                key: "/spec-models",
                icon: <DollarOutlined />,
                label: <Link to="/spec-models">规格工价</Link>,
              },
              {
                key: "/wage_logs",
                icon: <FileTextOutlined />,
                label: <Link to="/wage_logs">日薪录入</Link>,
              },
              {
                key: "/wage_logs_check",
                icon: <SearchOutlined />,
                label: <Link to="/wage_logs_check">工资查询</Link>,
              },
              {
                key: "/salary_import",
                icon: <UploadOutlined />,
                label: <Link to="/salary_import">薪资导入</Link>,
              },
            ],
          },

          // =============================
          // 2. 公司 & 客户 资金管理分组
          // =============================
          {
            key: "company-group",
            icon: <BankOutlined />,
            label: "往来账管理",
            children: [
              {
                key: "/company",
                icon: <SolutionOutlined />,
                label: <Link to="/company">公司管理</Link>,
              },
              {
                key: "/company_account",
                icon: <BankOutlined />,
                label: <Link to="/company_account">公司账户</Link>,
              },
              {
                key: "/customer",
                icon: <UserOutlined />,
                label: <Link to="/customer">客户管理</Link>,
              },
              {
                key: "/customer_account",
                icon: <SettingOutlined />,
                label: <Link to="/customer_account">客户账户</Link>,
              },
              {
                key: "/customer_balance",
                icon: <DollarOutlined />,
                label: <Link to="/customer_balance">客户余额</Link>,
              },
              {
                key: "/transaction",
                icon: <SwapOutlined />,
                label: <Link to="/transaction">转账流水</Link>,
              },
            ],
          },
        ]}
      />
    </div>
  );
};

export default Sidebar;
