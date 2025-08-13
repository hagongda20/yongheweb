import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, theme } from 'antd';
import WorkerPage from './pages/workers';
import ProcessPage from './pages/ProcessPage';
import SpecModelPage from './pages/SpecModelPage';
import Sidebar from './components/Sidebar';
import WageLogSearchPage from './pages/WageLogSearchPage';
import WageLogPage from './pages/WageLogPage';
import LoginPage from './pages/LoginPage';
import SalaryImportPage from './pages/SalaryImportPage';

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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/workers" element={<WorkerPage />} />
              <Route path="/processes" element={<ProcessPage />} />
              <Route path="/spec-models" element={<SpecModelPage />} />
              <Route path="/wage_logs" element={<WageLogPage />} />
              <Route path="/wage_logs_check" element={<WageLogSearchPage />} />
              <Route path="/salary_import" element={<SalaryImportPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;
