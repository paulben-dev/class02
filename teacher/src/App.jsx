import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssignHomework from './pages/AssignHomework';
import GradingList from './pages/GradingList';
import GradingDetail from './pages/GradingDetail';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AuthenticatedLayout() {
  return (
    <PrivateRoute>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assign" element={<AssignHomework />} />
          <Route path="/grading" element={<GradingList />} />
          <Route path="/grading/:id" element={<GradingDetail />} />
              <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </PrivateRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/teacher">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AuthenticatedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
