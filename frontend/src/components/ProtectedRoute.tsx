import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Nếu có role nhưng không được phép truy cập route này
    if (role === 'ADMIN') {
      return <Navigate to="/admin/users" replace />;
    }
    return <Navigate to="/student/exams" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
