import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import CandidateDetail from './pages/CandidateDetail';
import ImportData from './pages/ImportData';
import SelectionPanel from './pages/SelectionPanel';
import Telecalling from './pages/Telecalling';
import Locations from './pages/Locations';
import WalkInRegister from './pages/WalkInRegister';
import StatusTracker from './pages/StatusTracker';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  return user ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<WalkInRegister />} />
        <Route path="/status/:token" element={<StatusTracker />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:id" element={<CandidateDetail />} />
          <Route path="import" element={<ImportData />} />
          <Route path="selection" element={<SelectionPanel />} />
          <Route path="telecalling" element={<Telecalling />} />
          <Route path="locations" element={<Locations />} />
        </Route>
      </Routes>
    </>
  );
}
