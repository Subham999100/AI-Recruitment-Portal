import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.status === 'PENDING' || user?.status === 'REJECTED') {
    return (
      <div className="min-h-screen bg-[#030006] p-8 text-center text-white">
        <h1 className="text-2xl font-bold">{user.status === 'PENDING' ? 'Approval pending' : 'Access denied'}</h1>
        <p className="mt-3 text-gray-400">
          {user.status === 'PENDING'
            ? 'Your account is waiting for administrator approval.'
            : 'Your registration request was rejected.'}
        </p>
      </div>
    );
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
