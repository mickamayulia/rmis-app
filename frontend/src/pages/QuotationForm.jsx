import { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle, AlertCircle, Loader2, FileText, Plus, Trash2 } from 'lucide-react';

// Zod Schema Definition
const quotationSchema = z.object({
  job_no: z.string().min(1, 'Job Number wajib diisi'),
  date_in: z.string().min(1, 'Date In wajib diisi'),
  customer_name: z.string().optional(),
  contact_person: z.string().optional(),
  address: z.string().optional(),
  wo: z.string().optional(),
  an: z.string().optional(),
  po: z.string().optional(),
  unit_model: z.string().optional(),
  part_description: z.string().optional(),
  part_number: z.string().min(1, 'Part Number wajib diisi'),
  qty_in: z.preprocess((val) => Number(val), z.number().min(1, 'Qty minimal 1')),
  labor_cost: z.preprocess((val) => Number(val) || 0, z.number().min(0)),
  material_cost: z.preprocess((val) => Number(val) || 0, z.number().min(0)),
  jam: z.string().optional(),
  estimated_completion: z.string().optional(),
  remarks: z.string().optional(),
  procedures: z.string().optional(),
  inspections: z.array(z.object({
    check_point: z.string().optional(),
    x_before: z.string().optional(),
    x_after: z.string().optional(),
    y_before: z.string().optional(),
    y_after: z.string().optional(),
    z_before: z.string().optional(),
    z_after: z.string().optional(),
    deskripsi: z.string().optional()
  })).optional()
  // images is handled manually outside zod because it's a FileList
});

const QuotationForm = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const { register, control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      qty_in: 1,
      labor_cost: 0,
      material_cost: 0,
      procedures: '',
      inspections: []
    }
  });

  const { fields: inspectionFields, append: appendInspection, remove: removeInspection } = useFieldArray({ control, name: 'inspections' });

  const [selectedFiles, setSelectedFiles] = useState([]);

  // Auto-calculate estimated completion date (12 days after date_in)
  const dateInValue = watch('date_in');
  useEffect(() => {
    if (dateInValue) {
      const d = new Date(dateInValue);
      d.setDate(d.getDate() + 12);
      setValue('estimated_completion', d.toISOString().split('T')[0], { shouldValidate: true });
    }
  }, [dateInValue, setValue]);

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage(null);
    setPdfUrl(null);

    // Construct FormData
    const payload = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'procedures' || key === 'inspections') {
        payload.append(key, JSON.stringify(data[key]));
      } else if (data[key] !== undefined && data[key] !== null) {
        payload.append(key, data[key]);
      }
    });

    selectedFiles.forEach((file) => {
      payload.append('images', file);
    });

    try {
      const response = await axios.post('http://localhost:5000/api/v1/quotations/generate', payload, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: response.data.message });
      setPdfUrl(`http://localhost:5000${response.data.data.pdfUrl}`);
      reset(); // Clear form on success
      setSelectedFiles([]); // Clear files
    } catch (error) {
      const errCode = error.response?.data?.code;
      const errMsg = error.response?.data?.message || 'Terjadi kesalahan saat memproses quotation.';
      setMessage({ type: 'error', text: errCode ? `[${errCode}] ${errMsg}` : errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Quotation Generator</h1>
        <p className="text-sm text-gray-500 mt-1">Isi formulir berikut untuk mencetak dokumen Quotation dan menyimpannya ke database (Single Entry).</p>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-md flex items-start gap-3 border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle size={20} className="text-green-600 mt-0.5" /> : <AlertCircle size={20} className="text-red-600 mt-0.5" />}
          <div>
            <p className="font-medium text-sm">{message.text}</p>
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold underline mt-1 inline-block">
                Lihat / Unduh Dokumen DOCX
              </a>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Header Section */}
          <div className="col-span-1 md:col-span-2 pb-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">1. Header Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Number *</label>
                <input type="text" {...register('job_no')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" placeholder="Contoh: JN. 15991" />
                {errors.job_no && <p className="text-red-500 text-xs mt-1">{errors.job_no.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date In *</label>
                <input type="date" {...register('date_in')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" />
                {errors.date_in && <p className="text-red-500 text-xs mt-1">{errors.date_in.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input type="text" {...register('customer_name')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input type="text" {...register('contact_person')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea rows="2" {...register('address')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"></textarea>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ref (WO)</label>
                  <input type="text" {...register('wo')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ref (AN)</label>
                  <input type="text" {...register('an')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                <input type="text" {...register('po')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" />
              </div>
            </div>
          </div>

          {/* Component Section */}
          <div className="col-span-1 md:col-span-2 pb-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">2. Component Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Part Description</label>
                <input type="text" {...register('part_description')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part Number *</label>
                <input type="text" {...register('part_number')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" />
                {errors.part_number && <p className="text-red-500 text-xs mt-1">{errors.part_number.message}</p>}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Model</label>
                  <input type="text" {...register('unit_model')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                  <input type="number" min="1" {...register('qty_in')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" />
                  {errors.qty_in && <p className="text-red-500 text-xs mt-1">{errors.qty_in.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Procedures & Inspections Section */}
          <div className="col-span-1 md:col-span-2 pb-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">3. Procedures & Inspections</h3>
            
            {/* Procedures */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Procedures (One per line)</label>
              <textarea 
                rows="5" 
                {...register('procedures')} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" 
                placeholder="1. Dismantle component&#10;2. Clean all parts&#10;3. Inspect for damages..."
              ></textarea>
            </div>

            {/* Inspections */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Inspection Findings</label>
                <button type="button" onClick={() => appendInspection({ check_point: '', x_before: '', x_after: '', y_before: '', y_after: '', z_before: '', z_after: '', deskripsi: '' })} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800">
                  <Plus size={14} /> Add Inspection
                </button>
              </div>
              <div className="space-y-3">
                {inspectionFields.map((field, index) => (
                  <div key={field.id} className="p-3 border border-gray-200 rounded-md bg-gray-50 relative">
                    <button type="button" onClick={() => removeInspection(index)} className="absolute top-2 right-2 text-red-500 p-1 hover:bg-red-100 rounded">
                      <Trash2 size={16} />
                    </button>
                    <p className="text-xs font-semibold mb-2 text-gray-600">Item #{index + 1}</p>
                    
                    <div className="mb-2">
                      <input type="text" {...register(`inspections.${index}.check_point`)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs mb-2" placeholder="Check Point Name" />
                      
                      {/* Measurements Grid */}
                      <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded border border-gray-100">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-semibold text-gray-500 uppercase">Sumbu X</label>
                          <input type="text" {...register(`inspections.${index}.x_before`)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Before" />
                          <input type="text" {...register(`inspections.${index}.x_after`)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="After" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-semibold text-gray-500 uppercase">Sumbu Y</label>
                          <input type="text" {...register(`inspections.${index}.y_before`)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Before" />
                          <input type="text" {...register(`inspections.${index}.y_after`)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="After" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-semibold text-gray-500 uppercase">Sumbu Z</label>
                          <input type="text" {...register(`inspections.${index}.z_before`)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Before" />
                          <input type="text" {...register(`inspections.${index}.z_after`)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="After" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <textarea rows="2" {...register(`inspections.${index}.deskripsi`)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Description"></textarea>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {inspectionFields.length === 0 && <p className="text-xs text-gray-500 italic">No inspection findings added.</p>}
            </div>
          </div>

          {/* Pricing & Terms Section */}
          <div className="col-span-1 md:col-span-2 pb-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">4. Pricing & Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Est. Jam (Hours)</label>
                <input type="text" {...register('jam')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" placeholder="e.g. 5 Jam" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Labor Cost (Rp)</label>
                <input type="number" {...register('labor_cost')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Cost (Rp)</label>
                <input type="number" {...register('material_cost')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" />
              </div>
              <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Completion Date</label>
                  <input type="date" {...register('estimated_completion')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Notes</label>
                  <textarea rows="2" {...register('remarks')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="col-span-1 md:col-span-2 pb-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">5. Attachments (Images)</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Local Images</label>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" 
              />
              {selectedFiles.length > 0 && (
                <div className="mt-3 text-xs text-gray-600">
                  <p className="font-semibold mb-1">Selected files:</p>
                  <ul className="list-disc pl-5">
                    {selectedFiles.map((f, i) => (
                      <li key={i}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            Generate DOCX
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;
