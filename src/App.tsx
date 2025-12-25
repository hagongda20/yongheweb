import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, theme } from 'antd';
import WorkerPage from './pages/workers';
import ProcessPage from './pages/ProcessPage';
import SpecModelPage from './pages/SpecModelPage';
import Sidebar from './components/Sidebar';
import WageLogSearchPage from './pages/WageLogSearchPage';
import WageLogPage from './pages/WageLogPage';
import LoginPage from './pages/LoginPage';
import LoginRegister from './pages/users/LoginRegister';
import SalaryImportPage from './pages/SalaryImportPage';
import CompanyManagement from './pages/company_ledger/CompanyManagement'
import CustomerPage from './pages/company_ledger/CustomerPage'
import CustomerAccountPage from './pages/company_ledger/CustomerAccountPage';
import CompanyAccountPage from './pages/company_ledger/CompanyAccountPage';
import CustomerBalancePage from './pages/company_ledger/CustomerBalancePage';
import TransactionPage from './pages/company_ledger/TransactionPage';
import AuditUser from './pages/users/AuditUser';

const {Content, Sider } = Layout;

function App() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={200}>
          <Sidebar />
        </Sider>
        <Layout>
          
          <Content style={{ margin: '16px', background: colorBgContainer, padding: 24 }}>
            <Routes>
              <Route path="/registerList" element={<AuditUser />} />
              <Route path="/login" element={<LoginRegister />} />
              <Route path="/workers" element={<WorkerPage />} />
              <Route path="/processes" element={<ProcessPage />} />
              <Route path="/spec-models" element={<SpecModelPage />} />
              <Route path="/wage_logs" element={<WageLogPage />} />
              <Route path="/wage_logs_check" element={<WageLogSearchPage />} />
              <Route path="/salary_import" element={<SalaryImportPage />} />
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
    </Router>
  );
}

export default App;
