import { useState } from 'react';
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
  unit_model: z.string().optional(),
  part_description: z.string().optional(),
  part_number: z.string().min(1, 'Part Number wajib diisi'),
  qty_in: z.preprocess((val) => Number(val), z.number().min(1, 'Qty minimal 1')),
  labor_cost: z.preprocess((val) => Number(val) || 0, z.number().min(0)),
  material_cost: z.preprocess((val) => Number(val) || 0, z.number().min(0)),
  jam: z.string().optional(),
  remarks: z.string().optional(),
  procedures: z.string().optional(),
  inspections: z.array(z.object({
    check_point: z.string().optional(),
    condition: z.string().optional(),
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

// Shared class constants
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm';
const inputSmCls = 'w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white';
const sectionTitleCls = 'text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
const labelSmCls = 'block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1';

const QuotationForm = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [docxUrl, setDocxUrl] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const { register, control, handleSubmit, formState: { errors }, reset } = useForm({
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

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setSelectedFiles(prev => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 6) {
        alert("Maksimal 6 gambar yang diperbolehkan! Gambar berlebih akan diabaikan.");
      }
      return combined.slice(0, 6);
    });
    // Reset input agar bisa memilih file yang sama lagi jika sempat dihapus
    e.target.value = null;
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage(null);
    setPdfUrl(null);
    setDocxUrl(null);

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
      setDocxUrl(`http://localhost:5000${response.data.data.docxUrl}`);
      reset();
      setSelectedFiles([]);
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
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Quotation Generator</h1>
        <p className="text-sm text-gray-500 mt-1">Isi formulir berikut untuk mencetak dokumen Quotation dan menyimpannya ke database.</p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 mb-6 rounded-lg flex items-start gap-3 border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.type === 'success'
            ? <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
            : <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />}
          <div className="w-full">
            <p className="font-medium text-sm">{message.text}</p>
            {docxUrl && (
              <div className="flex gap-4 mt-3">
                <a href={docxUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-md transition-colors inline-flex items-center gap-2">
                  <FileText size={16} /> Unduh DOCX (Word)
                </a>
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md transition-colors inline-flex items-center gap-2">
                  <FileText size={16} /> Unduh PDF
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-8">

          {/* ── 1. Header Information ── */}
          <div className="pb-6 border-b border-gray-100">
            <h3 className={sectionTitleCls}>1. Header Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Job Number <span className="text-red-500">*</span></label>
                <input type="text" {...register('job_no')} className={inputCls} placeholder="Contoh: JN. 15991" />
                {errors.job_no && <p className="text-red-500 text-xs mt-1">{errors.job_no.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Date In <span className="text-red-500">*</span></label>
                <input type="date" {...register('date_in')} className={inputCls} />
                {errors.date_in && <p className="text-red-500 text-xs mt-1">{errors.date_in.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Customer Name</label>
                <input type="text" {...register('customer_name')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Contact Person</label>
                <input type="text" {...register('contact_person')} className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Address</label>
                <textarea rows="2" {...register('address')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ref (WO)</label>
                <input type="text" {...register('wo')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ref (AN)</label>
                <input type="text" {...register('an')} className={inputCls} />
              </div>
            </div>
          </div>

          {/* ── 2. Component Details ── */}
          <div className="pb-6 border-b border-gray-100">
            <h3 className={sectionTitleCls}>2. Component Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Part Description</label>
                <input type="text" {...register('part_description')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Part Number <span className="text-red-500">*</span></label>
                <input type="text" {...register('part_number')} className={inputCls} />
                {errors.part_number && <p className="text-red-500 text-xs mt-1">{errors.part_number.message}</p>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Unit Model</label>
                  <input type="text" {...register('unit_model')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Qty In</label>
                  <input type="number" min="1" {...register('qty_in')} className={inputCls} />
                  {errors.qty_in && <p className="text-red-500 text-xs mt-1">{errors.qty_in.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. Procedures & Inspections ── */}
          <div className="pb-6 border-b border-gray-100">
            <h3 className={sectionTitleCls}>3. Procedures &amp; Inspections</h3>

            {/* Procedures */}
            <div className="mb-6">
              <label className={labelCls}>Procedures</label>
              <p className="text-xs text-gray-400 mb-2">
                Tulis setiap langkah pada baris baru — akan otomatis menjadi poin bernomor di dokumen, dan di-copy ke kolom <em>Measure</em> setiap inspection.
              </p>
              <textarea
                rows="6"
                {...register('procedures')}
                className={inputCls + ' font-mono leading-relaxed'}
                placeholder={'Dismantle component\nClean all parts\nInspect for wear and damage\nReplace bearing\nReassemble and test run'}
              />
            </div>

            {/* Inspections */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <label className={labelCls + ' mb-0'}>Inspection Findings</label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Tambahkan checkpoint dengan kondisi, tabel pengukuran (X/Y/Z sebelum &amp; sesudah), dan keterangan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => appendInspection({ check_point: '', condition: '', x_before: '', x_after: '', y_before: '', y_after: '', z_before: '', z_after: '', deskripsi: '' })}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors shrink-0 ml-4"
                >
                  <Plus size={13} /> Add Checkpoint
                </button>
              </div>

              {inspectionFields.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-400">Belum ada inspection checkpoint.</p>
                  <p className="text-xs text-gray-300 mt-1">Klik "Add Checkpoint" untuk menambahkan.</p>
                </div>
              )}

              <div className="space-y-4">
                {inspectionFields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                    {/* Card Header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 border-b border-gray-200">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Checkpoint #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeInspection(index)}
                        className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Check Point Name */}
                      <div>
                        <label className={labelSmCls}>Nama Check Point</label>
                        <input
                          type="text"
                          {...register(`inspections.${index}.check_point`)}
                          className={inputSmCls}
                          placeholder="Contoh: Main Shaft Bearing, Hydraulic Seal, Gear Housing..."
                        />
                      </div>

                      {/* Condition */}
                      <div>
                        <label className={labelSmCls}>Kondisi / Temuan</label>
                        <textarea
                          rows="2"
                          {...register(`inspections.${index}.condition`)}
                          className={inputSmCls}
                          placeholder="Deskripsikan kondisi yang ditemukan, contoh: Terdapat keausan pada permukaan shaft, clearance melebihi toleransi standar..."
                        />
                      </div>

                      {/* Measurement Table */}
                      <div>
                        <label className={labelSmCls}>Tabel Pengukuran (Before / After)</label>
                        <div className="bg-white border border-gray-200 rounded-md overflow-hidden text-xs">
                          {/* Header Row */}
                          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-500 uppercase text-[10px] tracking-wide">
                            <div className="px-3 py-2">Sumbu</div>
                            <div className="px-3 py-2 border-l border-gray-200 text-center">Before</div>
                            <div className="px-3 py-2 border-l border-gray-200 text-center">After</div>
                          </div>
                          {/* X */}
                          <div className="grid grid-cols-3 border-b border-gray-100 items-center">
                            <div className="px-3 py-2 font-bold text-gray-700">X</div>
                            <div className="px-2 py-1 border-l border-gray-100">
                              <input type="text" {...register(`inspections.${index}.x_before`)} className="w-full focus:outline-none text-xs bg-transparent text-center" placeholder="—" />
                            </div>
                            <div className="px-2 py-1 border-l border-gray-100">
                              <input type="text" {...register(`inspections.${index}.x_after`)} className="w-full focus:outline-none text-xs bg-transparent text-center" placeholder="—" />
                            </div>
                          </div>
                          {/* Y */}
                          <div className="grid grid-cols-3 border-b border-gray-100 items-center">
                            <div className="px-3 py-2 font-bold text-gray-700">Y</div>
                            <div className="px-2 py-1 border-l border-gray-100">
                              <input type="text" {...register(`inspections.${index}.y_before`)} className="w-full focus:outline-none text-xs bg-transparent text-center" placeholder="—" />
                            </div>
                            <div className="px-2 py-1 border-l border-gray-100">
                              <input type="text" {...register(`inspections.${index}.y_after`)} className="w-full focus:outline-none text-xs bg-transparent text-center" placeholder="—" />
                            </div>
                          </div>
                          {/* Z */}
                          <div className="grid grid-cols-3 items-center">
                            <div className="px-3 py-2 font-bold text-gray-700">Z</div>
                            <div className="px-2 py-1 border-l border-gray-100">
                              <input type="text" {...register(`inspections.${index}.z_before`)} className="w-full focus:outline-none text-xs bg-transparent text-center" placeholder="—" />
                            </div>
                            <div className="px-2 py-1 border-l border-gray-100">
                              <input type="text" {...register(`inspections.${index}.z_after`)} className="w-full focus:outline-none text-xs bg-transparent text-center" placeholder="—" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Deskripsi / Additional Notes */}
                      <div>
                        <label className={labelSmCls}>Keterangan Tambahan</label>
                        <textarea
                          rows="2"
                          {...register(`inspections.${index}.deskripsi`)}
                          className={inputSmCls}
                          placeholder="Rekomendasi tindakan, catatan teknis, atau informasi tambahan lainnya..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 4. Pricing & Terms ── */}
          <div className="pb-6 border-b border-gray-100">
            <h3 className={sectionTitleCls}>4. Pricing &amp; Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Est. Jam Kerja</label>
                <input type="text" {...register('jam')} className={inputCls} placeholder="Contoh: 5 Jam" />
              </div>
              <div>
                <label className={labelCls}>Labor Cost (Rp)</label>
                <input type="number" {...register('labor_cost')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Material Cost (Rp)</label>
                <input type="number" {...register('material_cost')} className={inputCls} />
              </div>
              <div className="md:col-span-3">
                <label className={labelCls}>Notes / Remarks</label>
                <textarea rows="2" {...register('remarks')} className={inputCls} placeholder="Catatan tambahan untuk quotation ini..." />
              </div>
            </div>
          </div>

          {/* ── 5. Attachments ── */}
          <div>
            <h3 className={sectionTitleCls}>5. Attachments (Images)</h3>
            <label className={labelCls}>
              Upload Foto Komponen{' '}
              <span className="text-gray-400 font-normal text-xs">(maks. 6 gambar, akan disisipkan ke dokumen)</span>
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-[9px] font-bold text-gray-600 shrink-0">{i + 1}</span>
                      <span className="truncate">{f.name}</span>
                      <span className="text-gray-400 shrink-0">({(f.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeFile(i)} 
                      className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Submit */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Field bertanda <span className="text-red-500 font-medium">*</span> wajib diisi sebelum generate.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            {loading ? 'Generating...' : 'Generate DOCX'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;
