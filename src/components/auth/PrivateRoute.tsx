// src/components/auth/PrivateRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface PrivateRouteProps {
  // If you are using react-router-dom v6 with <Route element={<PrivateRoute><Dashboard /></PrivateRoute>} />
  // then children is the way to go.
  children?: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('authToken'); // Check for the token

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If using <Route element={<PrivateRoute />}><Route path="dashboard" element={<Dashboard />} /></Route> (nested routes)
  // you would use <Outlet /> here instead of children.
  // For a wrapper component like <PrivateRoute><SomeComponent /></PrivateRoute>, children is correct.
  return <>{children}</>;
  // Or if you prefer to always use Outlet for consistency with potential future nested private routes:
  // return <Outlet />; // This would require DashboardPage to be a child route of PrivateRoute in App.tsx
};

export default PrivateRoute;
