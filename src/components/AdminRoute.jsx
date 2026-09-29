import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import LoadingScreen from './LoadingScreen';

export default function AdminRoute({ children }) {
  const { currentUser, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <LoadingScreen 
        message="Verifying admin credentials..." 
        subtext="Connecting to Appwrite Cloud Zero-Trust Admin Controller..." 
      />
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
