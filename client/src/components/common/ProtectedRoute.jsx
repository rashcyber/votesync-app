import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, role = 'admin' }) {
  const { admin, adminToken, voter, voterToken, loading } = useAuth();
  const { electionId } = useParams();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (role === 'admin' && !adminToken) {
    return <Navigate to="/admin/login" replace />;
  }

  if (role === 'voter' && !voterToken) {
    // Redirect back to the voter login for this specific election
    return <Navigate to={electionId ? `/vote/${electionId}` : '/'} replace />;
  }

  return children;
}
