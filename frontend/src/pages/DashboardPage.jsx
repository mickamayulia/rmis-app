import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Activity, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement
);

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalActive: 0,
    totalCompleted: 0,
    totalInProgress: 0,
    totalOverdue: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [customerFilter, setCustomerFilter] = useState('');
  const [customersList, setCustomersList] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [customerFilter]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/v1/repairs/customers', {
        withCredentials: true
      });
      setCustomersList(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const params = new URLSearchParams({ limit: 1000 });
      if (customerFilter) params.append('customer', customerFilter);

      const res = await axios.get(`http://localhost:5000/api/v1/repairs?${params.toString()}`, {
        withCredentials: true
      });
      
      const repairs = res.data.data;
      
      let completed = 0;
      let inProgress = 0;
      let overdue = 0;
      
      // Inisialisasi array untuk menghitung tren bulanan (Jan - Dec)
      const monthsCount = Array(12).fill(0);
      const currentYear = new Date().getFullYear();

      repairs.forEach(repair => {
        if (repair.status === 'Completed') completed++;
        else if (repair.status === 'In Progress') inProgress++;
        else if (repair.status === 'Overdue' || repair.remaining_days < 0) overdue++;
        
        // Cek bulan untuk bar chart
        const dateIn = new Date(repair.date_in);
        if (dateIn.getFullYear() === currentYear) {
          monthsCount[dateIn.getMonth()]++;
        }
      });

      setStats({
        totalActive: inProgress + overdue,
        totalCompleted: completed,
        totalInProgress: inProgress,
        totalOverdue: overdue
      });

      setMonthlyData(monthsCount);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data analitik.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
        Memuat analitik...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-10 p-6 bg-red-50 text-red-600 rounded-lg">
        <AlertTriangle className="mx-auto mb-2" size={32} />
        {error}
      </div>
    );
  }

  // Konfigurasi Bar Chart
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Komponen Masuk',
        data: monthlyData,
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue-500
        borderRadius: 4,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    }
  };

  // Konfigurasi Donut Chart
  const donutData = {
    labels: ['Completed', 'In Progress', 'Overdue'],
    datasets: [
      {
        data: [stats.totalCompleted, stats.totalInProgress, stats.totalOverdue],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // green-500
          'rgba(234, 179, 8, 0.8)', // yellow-500
          'rgba(239, 68, 68, 0.8)', // red-500
        ],
        borderWidth: 0,
      }
    ]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Ringkasan performa bengkel dan status 12-Day SLA.</p>
        </div>
        <div className="w-full sm:w-64">
          <select
            className="block w-full pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border shadow-sm"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          >
            <option value="">Semua Perusahaan</option>
            {customersList.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Repairs</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalActive}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <Activity size={24} />
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Completed</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalCompleted}</h3>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
            <CheckCircle size={24} />
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">In Progress</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalInProgress}</h3>
          </div>
          <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600">
            <Clock size={24} />
          </div>
        </div>
        {/* Card 4 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Overdue (SLA Failed)</p>
            <h3 className="text-3xl font-bold text-red-600 mt-1">{stats.totalOverdue}</h3>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Tren Perbaikan Masuk ({new Date().getFullYear()})</h3>
          <div className="h-72">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Sebaran Status</h3>
          <div className="h-64 relative flex items-center justify-center">
             <Doughnut data={donutData} options={donutOptions} />
             {/* Center Text */}
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                <span className="text-3xl font-bold text-gray-800">{stats.totalActive + stats.totalCompleted}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Data</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
