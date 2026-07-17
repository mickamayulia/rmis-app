import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, Filter, Loader2, AlertTriangle, Eye, Activity, Printer, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const RepairsPage = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await axios.get(`http://localhost:5000/api/v1/repairs?${params.toString()}`, {
        withCredentials: true
      });
      setRepairs(response.data.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data monitoring SLA.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRepairs();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter]);

  const handleExportExcel = () => {
    const dataToExport = repairs.map(r => ({
      'Job No': r.job_no,
      'PO Number': r.po || '-',
      'Customer': r.customer_name || '-',
      'Model': r.unit_model || '-',
      'Date In': new Date(r.date_in).toLocaleDateString('id-ID'),
      'Date Out': r.date_out ? new Date(r.date_out).toLocaleDateString('id-ID') : '-',
      'Repair Days': r.repair_days,
      'Remaining (SLA)': r.remaining_days,
      'Status': r.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monitoring SLA");
    XLSX.writeFile(workbook, `Monitoring_SLA_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full bg-green-100 text-green-700">Completed</span>;
      case 'In Progress': return <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full bg-yellow-100 text-yellow-700">In Progress</span>;
      case 'Overdue': return <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full bg-red-100 text-red-700">Overdue</span>;
      default: return <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-blue-600" />
            12-Day SLA Monitoring
          </h1>
          <p className="text-sm text-gray-500 mt-1 print:hidden">Lacak status perbaikan komponen dari masuk hingga selesai.</p>
        </div>
        
        <div className="print:hidden flex items-center gap-2">
          <button 
            onClick={handleExportExcel} 
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-700 transition-colors"
          >
            <Printer size={16} /> Cetak Tabel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="print:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="Cari Job No, Customer, Model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter size={16} className="text-gray-400" />
          <select
            className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Job No</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Customer / Model</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date In &rarr; Out</th>
                <th scope="col" className="px-6 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Repair Days</th>
                <th scope="col" className="px-6 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Remaining (SLA)</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin text-blue-500 mx-auto mb-2" size={24} />
                    <p className="text-sm text-gray-500">Memuat data monitoring...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-red-500 bg-red-50">
                    <AlertTriangle className="mx-auto mb-2" size={24} />
                    <p className="text-sm font-medium">{error}</p>
                  </td>
                </tr>
              ) : repairs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-500">Belum ada data perbaikan yang tercatat.</p>
                  </td>
                </tr>
              ) : (
                repairs.map((repair) => {
                  const isOverdue = repair.status === 'Overdue' || repair.remaining_days < 0;
                  
                  return (
                    <tr key={repair.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900 text-sm">{repair.job_no}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{repair.po ? `PO: ${repair.po}` : 'NO PO'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{repair.customer_name || '-'}</div>
                        <div className="text-xs text-gray-500">{repair.unit_model || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div><span className="text-gray-400">IN:</span> {new Date(repair.date_in).toLocaleDateString('id-ID')}</div>
                        <div><span className="text-gray-400">OUT:</span> {repair.date_out ? new Date(repair.date_out).toLocaleDateString('id-ID') : '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-gray-700">{repair.repair_days}</span>
                        <span className="text-xs text-gray-500 ml-1">Hari</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-lg font-bold ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                          {repair.remaining_days > 0 ? `+${repair.remaining_days}` : repair.remaining_days}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">Hari</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(repair.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium print:hidden">
                        <Link to={`/repairs/${repair.job_no}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors">
                          <Eye size={14} /> Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RepairsPage;
