import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // Jika masih loading session, kembalikan null atau spinner
  if (loading) return null;

  // Jika user belum login, redirect ke halaman login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Jika route ini butuh role tertentu (Admin/Manager), cek rolenya
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Jika aman, render child routes
  return <Outlet />;
};

export default ProtectedRoute;
