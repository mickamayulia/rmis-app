import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, LogOut, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper untuk mengambil inisial nama
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Sidebar - Minimalist, thin border */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold tracking-tight">RMIS</h1>
          <p className="text-xs text-gray-500 mt-1">Repair Monitoring System</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          
          <NavLink 
            to="/repairs" 
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Activity size={18} /> Monitoring (SLA)
          </NavLink>

          {/* Hanya Admin & Super Admin yang bisa lihat menu Quotation Form */}
          {user && (user.role === 'Admin' || user.role === 'Super Admin') && (
            <NavLink 
              to="/imports" 
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <FileText size={18} /> Quotation Form
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <h2 className="text-lg font-medium text-gray-700">PT RAF ROBIAN TEHNIK</h2>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex flex-col items-end">
              <span className="font-semibold text-gray-800">{user?.name || 'User'}</span>
              <span className="text-xs text-blue-600">{user?.role || 'Guest'}</span>
            </div>
            <span className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              {getInitials(user?.name)}
            </span>
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
