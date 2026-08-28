import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function AdminRoute({ children }) {
  const { currentUser, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading admin session...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
