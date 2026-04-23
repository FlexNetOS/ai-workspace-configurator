import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Wizard from './pages/Wizard';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import Help from './pages/Help';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Wizard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </Layout>
  );
}
