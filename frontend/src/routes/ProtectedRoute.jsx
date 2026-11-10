import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 40, height: 40, border: '4px solid #E9E1F7', borderTopColor: '#A855F7',
          borderRadius: '50%', animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    if (requiredRole === 'ADMIN' && user.role !== 'ADMIN' && !user.is_superuser) {
      return <Navigate to="/dashboard" replace />;
    }
    if (requiredRole === 'ORGANIZER' && user.role !== 'ORGANIZER' && user.role !== 'ADMIN' && !user.is_superuser) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
