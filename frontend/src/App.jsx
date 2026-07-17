import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import QuotationForm from './pages/QuotationForm';
import LoginPage from './pages/LoginPage';
import RepairsPage from './pages/RepairsPage';
import RepairDetailPage from './pages/RepairDetailPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Default Redirect to monitoring */}
          <Route path="/" element={<Navigate to="/repairs" replace />} />
          
          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* Monitoring is accessible to all roles */}
              <Route path="/repairs" element={<RepairsPage />} />
              <Route path="/repairs/:id" element={<RepairDetailPage />} />
              
              {/* Dashboard is accessible to all roles */}
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Quotation Form restricted to Admin and Super Admin */}
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']} />}>
                <Route path="/imports" element={<QuotationForm />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
