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
  const [customerFilter, setCustomerFilter] = useState('');
  const [customersList, setCustomersList] = useState([]);

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

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (customerFilter) params.append('customer', customerFilter);
      
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
  }, [searchTerm, statusFilter, customerFilter]);

  const handleExportExcel = () => {
    const dataToExport = repairs.map(r => ({
      'Part Number': r.part_number || '-',
      'Job No': r.job_no || '-',
      'Customer': r.customer_name || '-',
      'WO': r.wo || '-',
      'AN': r.an || '-',
      'PO': r.po || '-',
      'Jumlah Barang Masuk': r.qty_in || 0,
      'Jumlah Barang Keluar': r.qty_out || 0,
      'Date In': new Date(r.date_in).toLocaleDateString('id-ID'),
      'Date Out': r.date_out ? new Date(r.date_out).toLocaleDateString('id-ID') : '-',
      'Model': r.unit_model || '-',
      'Part Description': r.part_description || '-',
      'SOH': r.soh || '-',
      'Status': r.status || '-',
      'Jumlah Hari Pengerjaan': r.repair_days,
      'Sisa Hari Pengerjaan': r.remaining_days
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 30 },
      { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 25 }
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monitoring SLA");
    XLSX.writeFile(workbook, `Monitoring_SLA_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return <span className="badge px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded bg-green-100 text-green-700 border border-transparent print:border-black">Completed</span>;
      case 'In Progress': return <span className="badge px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded bg-yellow-100 text-yellow-700 border border-transparent print:border-black">In Progress</span>;
      case 'Overdue': return <span className="badge px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded bg-red-100 text-red-700 border border-transparent print:border-black">Overdue</span>;
      default: return <span className="badge px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded bg-gray-100 text-gray-700 border border-transparent print:border-black">{status}</span>;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .shadow-sm { box-shadow: none !important; }
          .border-gray-200 { border-color: #000 !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #000 !important; padding: 4px 6px !important; color: #000 !important; font-size: 8px !important; }
          th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          .text-red-600 { color: #dc2626 !important; }
        }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-blue-600 print:hidden" />
            Monitoring Table 12-Day SLA
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
            placeholder="Cari Job No, Part No, WO, Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
          <Filter size={16} className="text-gray-400 shrink-0" />
          <select
            className="block w-full min-w-[160px] pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          >
            <option value="">Semua Perusahaan</option>
            {customersList.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="block w-full min-w-[140px] pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border"
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
                <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-500 uppercase tracking-wider">Part No</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-500 uppercase tracking-wider">Job No</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-500 uppercase tracking-wider">WO / AN / PO</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold text-gray-500 uppercase tracking-wider">Qty IN/OUT</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-500 uppercase tracking-wider">Date In &rarr; Out</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-500 uppercase tracking-wider">Model / Desc</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold text-gray-500 uppercase tracking-wider">SOH</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold text-gray-500 uppercase tracking-wider">SLA</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold text-gray-500 uppercase tracking-wider print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="12" className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin text-blue-500 mx-auto mb-2" size={24} />
                    <p className="text-sm text-gray-500">Memuat data monitoring...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="12" className="px-6 py-12 text-center text-red-500 bg-red-50">
                    <AlertTriangle className="mx-auto mb-2" size={24} />
                    <p className="text-sm font-medium">{error}</p>
                  </td>
                </tr>
              ) : repairs.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-500">Belum ada data perbaikan yang tercatat.</p>
                  </td>
                </tr>
              ) : (
                repairs.map((repair) => {
                  const isOverdue = repair.status === 'Overdue' || repair.remaining_days < 0;
                  
                  return (
                    <tr key={repair.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}>
                      <td className="px-3 py-3 whitespace-nowrap text-[10px] font-mono text-gray-700">{repair.part_number || '-'}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-[10px] font-bold text-gray-900">{repair.job_no}</td>
                      <td className="px-3 py-3 text-[10px] text-gray-900 min-w-[120px]">{repair.customer_name || '-'}</td>
                      <td className="px-3 py-3 text-[10px] text-gray-600 whitespace-nowrap">
                        <div>WO: <span className="font-medium text-gray-900">{repair.wo || '-'}</span></div>
                        <div>AN: <span className="font-medium text-gray-900">{repair.an || '-'}</span></div>
                        <div>PO: <span className="font-medium text-gray-900">{repair.po || '-'}</span></div>
                      </td>
                      <td className="px-3 py-3 text-center text-[10px] text-gray-600 whitespace-nowrap">
                        <div>IN: <span className="font-bold text-gray-900">{repair.qty_in || 0}</span></div>
                        <div>OUT: <span className="font-bold text-gray-900">{repair.qty_out || 0}</span></div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-[10px] text-gray-600">
                        <div>IN: {new Date(repair.date_in).toLocaleDateString('id-ID')}</div>
                        <div>OUT: {repair.date_out ? new Date(repair.date_out).toLocaleDateString('id-ID') : '-'}</div>
                      </td>
                      <td className="px-3 py-3 text-[10px] text-gray-900 min-w-[150px]">
                        <div className="font-semibold">{repair.unit_model || '-'}</div>
                        <div className="text-gray-500 line-clamp-2">{repair.part_description || '-'}</div>
                      </td>
                      <td className="px-3 py-3 text-center text-[10px] font-medium text-gray-900">{repair.soh || '-'}</td>
                      <td className="px-3 py-3 text-[10px] min-w-[120px]">
                        <div className="mb-1">{getStatusBadge(repair.status)}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center text-[11px] font-bold text-gray-700">
                        {repair.repair_days}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center text-[11px] font-bold">
                        <span className={isOverdue ? 'text-red-600' : 'text-green-600'}>
                          {repair.remaining_days > 0 ? `+${repair.remaining_days}` : repair.remaining_days}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center print:hidden">
                        <Link to={`/repairs/${repair.job_no}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded transition-colors text-[10px] font-medium">
                          <Eye size={12} /> Detail
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
