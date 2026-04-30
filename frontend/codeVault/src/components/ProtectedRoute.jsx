import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

const ProtectedRoute = ({ children }) => {
  const { authLoading, user } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="page-shell">
        <div className="page-panel">Checking your session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
