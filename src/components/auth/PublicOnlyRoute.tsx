// src/components/auth/PublicOnlyRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('authToken');

  if (isAuthenticated) {
    // User is logged in, redirect them away from public-only pages (e.g., to dashboard)
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>; // User is not logged in, show the public page (login/register)
};

export default PublicOnlyRoute;