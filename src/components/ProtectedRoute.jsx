import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading session...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
