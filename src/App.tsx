import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Layout, theme } from "antd";
import Sidebar from "./components/Sidebar";

import WorkerPage from "./pages/workers";
import ProcessPage from "./pages/ProcessPage";
import SpecModelPage from "./pages/SpecModelPage";
import WageLogSearchPage from "./pages/WageLogSearchPage";
import WageLogPage from "./pages/WageLogPage";
import SalaryImportPage from "./pages/SalaryImportPage";
import LoginRegister from "./pages/users/LoginRegister";
import AuditUser from "./pages/users/AuditUser";

import CompanyManagement from "./pages/company_ledger/CompanyManagement";
import CustomerPage from "./pages/company_ledger/CustomerPage";
import CustomerAccountPage from "./pages/company_ledger/CustomerAccountPage";
import CompanyAccountPage from "./pages/company_ledger/CompanyAccountPage";
import CustomerBalancePage from "./pages/company_ledger/CustomerBalancePage";
import TransactionPage from "./pages/company_ledger/TransactionPage";

const { Content, Sider } = Layout;

/** ⭐ 单独拆一层，才能用 useLocation */
const AppLayout = () => {
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // ⭐ 登录页不显示侧边栏
  const hideSidebar = location.pathname === "/login";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!hideSidebar && (
        <Sider width={200}>
          <Sidebar />
        </Sider>
      )}

      <Layout>
        <Content
          style={{
            margin: hideSidebar ? 0 : "16px",
            background: colorBgContainer,
            padding: hideSidebar ? 0 : 24,
            minHeight: "100vh",
          }}
        >
          <Routes>
            {/* 登录 / 注册 */}
            <Route path="/login" element={<LoginRegister />} />

            {/* 用户管理 */}
            <Route path="/registerList" element={<AuditUser />} />

            {/* 工资管理 */}
            <Route path="/workers" element={<WorkerPage />} />
            <Route path="/processes" element={<ProcessPage />} />
            <Route path="/spec-models" element={<SpecModelPage />} />
            <Route path="/wage_logs" element={<WageLogPage />} />
            <Route path="/wage_logs_check" element={<WageLogSearchPage />} />
            <Route path="/salary_import" element={<SalaryImportPage />} />

            {/* 往来账 */}
            <Route path="/company" element={<CompanyManagement />} />
            <Route path="/customer" element={<CustomerPage />} />
            <Route path="/customer_account" element={<CustomerAccountPage />} />
            <Route path="/company_account" element={<CompanyAccountPage />} />
            <Route path="/customer_balance" element={<CustomerBalancePage />} />
            <Route path="/transaction" element={<TransactionPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
