import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, theme } from 'antd';
import WorkerPage from './pages/workers';
import ProcessPage from './pages/ProcessPage';
import SpecModelPage from './pages/SpecModelPage';
import Sidebar from './components/Sidebar';
import WagePricePage from './pages/WagePricePage';
import WageLogPage from './pages/WageLogPage';

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
              <Route path="/workers" element={<WorkerPage />} />
              <Route path="/processes" element={<ProcessPage />} />
              <Route path="/spec-models" element={<SpecModelPage />} />
              <Route path="/wage-prices" element={<WagePricePage />} />
              <Route path="/wage_logs" element={<WageLogPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;
