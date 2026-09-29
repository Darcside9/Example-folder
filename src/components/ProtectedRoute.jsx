import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute({ children }) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <LoadingScreen 
        message="Synchronizing user session..." 
        subtext="Fetching user wallet balance & account logs from Appwrite Cloud..." 
      />
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
