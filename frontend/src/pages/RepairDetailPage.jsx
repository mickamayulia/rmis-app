import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const RepairDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [repair, setRepair] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State untuk Field yang bisa diupdate
  const [formData, setFormData] = useState({
    po: '',
    qty_out: '',
    date_out: '',
    status: '',
    soh: '',
    remarks: ''
  });

  useEffect(() => {
    fetchRepairDetail();
  }, [id]);

  const fetchRepairDetail = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/v1/repairs/${id}`, { withCredentials: true });
      const data = res.data.data;
      setRepair(data);
      
      // Init form data (format date to YYYY-MM-DD for input[type=date])
      setFormData({
        po: data.po || '',
        qty_out: data.qty_out || '',
        date_out: data.date_out ? new Date(data.date_out).toISOString().split('T')[0] : '',
        status: data.status || 'In Progress',
        soh: data.soh || '',
        remarks: data.remarks || ''
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memuat detail perbaikan.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Validate chronological dates
      if (formData.date_out && new Date(formData.date_out) < new Date(repair.date_in)) {
        throw new Error('Tanggal keluar (Date Out) tidak boleh lebih awal dari Date In.');
      }

      await axios.put(`http://localhost:5000/api/v1/repairs/${id}`, formData, { withCredentials: true });
      setMessage({ type: 'success', text: 'Data berhasil diperbarui!' });
      
      // Auto redirect to repairs list after success
      setTimeout(() => {
        navigate('/repairs');
      }, 1500);

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Gagal menyimpan perubahan.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
        Memuat detail perbaikan...
      </div>
    );
  }

  if (!repair) return <div className="text-center mt-10">Data tidak ditemukan.</div>;

  const isAdmin = user && (user.role === 'Admin' || user.role === 'Super Admin');

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <button 
        onClick={() => navigate('/repairs')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} /> Kembali ke Monitoring
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Info */}
        <div className="bg-gray-50 p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{repair.job_no}</h1>
            <p className="text-sm text-gray-500 mt-1">{repair.customer_name} — {repair.unit_model}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              repair.status === 'Completed' ? 'bg-green-100 text-green-700' :
              repair.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {repair.status}
            </span>
            {repair.pdf_path && (
              <a 
                href={`http://localhost:5000${repair.pdf_path}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
              >
                <FileText size={14} /> Lihat Dokumen (DOCX)
              </a>
            )}
          </div>
        </div>

        {message && (
          <div className={`p-4 mx-6 mt-6 flex gap-3 text-sm rounded-lg border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Read-Only Info */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Informasi Dokumen</h3>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2"><span className="text-gray-500">Part Desc</span> <span className="col-span-2 font-medium">{repair.part_description || '-'}</span></div>
              <div className="grid grid-cols-3 gap-2"><span className="text-gray-500">Part No</span> <span className="col-span-2 font-medium">{repair.part_number || '-'}</span></div>
              <div className="grid grid-cols-3 gap-2"><span className="text-gray-500">Ref WO</span> <span className="col-span-2 font-medium">{repair.wo || '-'}</span></div>
              <div className="grid grid-cols-3 gap-2"><span className="text-gray-500">Ref AN</span> <span className="col-span-2 font-medium">{repair.an || '-'}</span></div>
            </div>
          </div>
          <div>
             <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Waktu &amp; Biaya</h3>
             <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2"><span className="text-gray-500">Date In</span> <span className="col-span-2 font-medium">{new Date(repair.date_in).toLocaleDateString('id-ID')}</span></div>
              <div className="grid grid-cols-3 gap-2"><span className="text-gray-500">Qty In</span> <span className="col-span-2 font-medium">{repair.qty_in} Unit</span></div>
              <div className="grid grid-cols-3 gap-2"><span className="text-gray-500">Labor Cost</span> <span className="col-span-2 font-medium">Rp {repair.labor_cost?.toLocaleString('id-ID')}</span></div>
              <div className="grid grid-cols-3 gap-2"><span className="text-gray-500">Material Cost</span> <span className="col-span-2 font-medium">Rp {repair.material_cost?.toLocaleString('id-ID')}</span></div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="border-t border-gray-200 bg-gray-50 p-6">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Update Monitoring Data</h3>
              {!isAdmin && <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">Hanya Admin yang dapat mengubah</span>}
           </div>
           
           <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor PO (Purchase Order)</label>
                  <input 
                    type="text" 
                    name="po"
                    value={formData.po} 
                    onChange={handleInputChange} 
                    disabled={!isAdmin}
                    placeholder="Diisi jika customer sudah bayar"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Perbaikan</label>
                  <select 
                    name="status"
                    value={formData.status} 
                    onChange={handleInputChange}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Keluar (Date Out)</label>
                  <input 
                    type="date" 
                    name="date_out"
                    value={formData.date_out} 
                    onChange={handleInputChange} 
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" 
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Mengisi ini akan menghentikan perhitungan SLA (Repair Days)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty Out</label>
                  <input 
                    type="number" 
                    name="qty_out"
                    value={formData.qty_out} 
                    onChange={handleInputChange} 
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SOH (Stock On Hand)</label>
                  <input 
                    type="text" 
                    name="soh"
                    value={formData.soh} 
                    onChange={handleInputChange} 
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks Tambahan</label>
                  <input 
                    type="text" 
                    name="remarks"
                    value={formData.remarks} 
                    onChange={handleInputChange} 
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" 
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              )}
           </form>
        </div>
      </div>
    </div>
  );
};

export default RepairDetailPage;
