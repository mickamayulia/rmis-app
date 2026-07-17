import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const LoginPage = () => {
  const { user, loginMock } = useAuth();
  const navigate = useNavigate();

  // Jika sudah login, langsung arahkan ke dashboard/monitoring
  useEffect(() => {
    if (user) {
      navigate('/repairs');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to RMIS
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Repair Monitoring Information System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-700 text-center mb-6">
                Ini adalah halaman login Mode Development (Mock). Tekan tombol di bawah untuk masuk sebagai Admin.
              </p>
              <button
                onClick={() => loginMock()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 items-center gap-2"
              >
                <LogIn size={20} />
                Login as Admin (Mock)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
