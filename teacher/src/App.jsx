import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssignHomework from './pages/AssignHomework';
import GradingList from './pages/GradingList';
import GradingDetail from './pages/GradingDetail';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/assign" element={<PrivateRoute><AssignHomework /></PrivateRoute>} />
          <Route path="/grading" element={<PrivateRoute><GradingList /></PrivateRoute>} />
          <Route path="/grading/:id" element={<PrivateRoute><GradingDetail /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
