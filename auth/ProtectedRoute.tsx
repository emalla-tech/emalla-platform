
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { isStaffRole } from './roleRouting';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Securing Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    user?.role === 'MERCHANT' &&
    user.mustChangePassword &&
    location.pathname !== '/seller/change-password'
  ) {
    return <Navigate to="/seller/change-password" replace />;
  }
  if (
    isStaffRole(user?.role) &&
    user?.mustChangePassword &&
    location.pathname !== '/staff/change-password'
  ) {
    return <Navigate to="/staff/change-password" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
