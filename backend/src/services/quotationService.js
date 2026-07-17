const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class QuotationService {
  /**
   * Generates a Quotation DOCX and saves the repair record to database
   * @param {Object} data The form data from frontend
   * @param {Number} userId The user ID creating the quotation
   */
  async generateAndSave(data, userId) {
    // 1. Prepare data and formatting
    const totalCost = (parseFloat(data.labor_cost) || 0) + (parseFloat(data.material_cost) || 0);
    
    // Format Date: Tanggal Bulan Tahun (Indonesian)
    const d = data.date_in ? new Date(data.date_in) : new Date();
    const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    
    // Format numbers
    const formatCurrency = (num) => Number(num).toLocaleString('id-ID');

    // 2. Read DOCX Template
    const templatePath = path.join(__dirname, '../templates/Quotation Form V2.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    
    // Configure ImageModule
    const emptyImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    const opts = {
        centered: false,
        getImage: function(tagValue, tagName) {
            // tagValue is the index of the image in the uploadedImages array
            const imgIndex = parseInt(tagValue, 10);
            if (!isNaN(imgIndex) && data.uploadedImages && data.uploadedImages[imgIndex]) {
                return data.uploadedImages[imgIndex].buffer;
            }
            return emptyImageBuffer;
        },
        getSize: function(img, tagValue, tagName) {
            // Jika gambarnya kosong, set ukurannya jadi 0 supaya tidak makan tempat
            if (img === emptyImageBuffer) {
                return [0, 0];
            }
            return [250, 250]; // Fixed size 250x250 pixels
        }
    };
    const imageModule = new ImageModule(opts);
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
      modules: [imageModule]
    });

    // Handle procedures string mapping
    let proceduresList = [];
    if (typeof data.procedures === 'string') {
        proceduresList = data.procedures.split('\n').filter(p => p.trim() !== '').map((desc, index) => ({
            list: index + 1,
            desc: desc.trim()
        }));
    } else if (Array.isArray(data.procedures)) {
        proceduresList = data.procedures.map((proc, index) => ({
            list: index + 1,
            desc: proc.description || proc
        }));
    }

    // Build measure raw xml
    let measureXml = proceduresList.map(p => `<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:t>${p.list}. ${p.desc}</w:t></w:r></w:p>`).join('');
    if (!measureXml) measureXml = '<w:p><w:r><w:t>-</w:t></w:r></w:p>';

    // Map inspections properly for docxtemplater row loops
    const inspectionsArray = data.inspections && data.inspections.length > 0
      ? data.inspections.map((insp, index) => {
          
          // Detect if this checkpoint has any measurement data at all
          const hasMeasurements = !!(
            insp.x_before || insp.x_after ||
            insp.y_before || insp.y_after ||
            insp.z_before || insp.z_after
          );
          
          // Helper untuk memformat angka menjadi float + mm
          const formatMeasure = (val) => {
              if (!val || val.toString().trim() === '-' || val.toString().trim() === '') return '-';
              const parsed = parseFloat(val.toString().replace(',', '.'));
              if (isNaN(parsed)) return val; // Jika kebetulan diisi teks, biarkan saja
              // Menggunakan toLocaleString untuk format koma desimal ala Indonesia (opsional, tapi pakai titik juga gapapa)
              return parsed.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 3 }) + ' mm';
          };

          return {
              no: index + 1,
              check_point: insp.check_point || '-',
              condition: insp.condition || '-',
              deskripsi: (insp.deskripsi && insp.deskripsi.trim() !== '' && insp.deskripsi !== 'undefined') ? insp.deskripsi : '',
              
              has_measurements: hasMeasurements,
              
              x_before: formatMeasure(insp.x_before),
              x_after:  formatMeasure(insp.x_after),
              y_before: formatMeasure(insp.y_before),
              y_after:  formatMeasure(insp.y_after),
              z_before: formatMeasure(insp.z_before),
              z_after:  formatMeasure(insp.z_after),

              // We pass proceduresList into each inspection so they can loop it in the Measure column
              measure_procedures: proceduresList.length > 0 ? proceduresList : [{ list: '-', desc: '' }],
          };
        })
      : [];

    // Map uploaded images for the database
    const imagesArray = data.uploadedImages && data.uploadedImages.length > 0 
      ? data.uploadedImages.map((file, idx) => ({ imgUrl: idx.toString() }))
      : [];

    // 3. Replace placeholders in DOCX
    doc.render({
      quotation_no: data.job_no || '-',
      date: dateStr,
      nama_perusahaan: data.customer_name || '-',
      contact_person: data.contact_person || '-',
      wo: data.wo || '-',
      an: data.an || '-',
      address: data.address || '-',
      model: data.unit_model || '-',
      name_compenent: data.part_description || '-',
      pn: data.part_number || '-',
      no: data.qty_in || 1, // Quantity
      procedures: proceduresList,
      
      // Images for left and right columns
      image1: '0',
      image2: '1',
      image3: '2',
      image4: '3',
      image5: '4',
      image6: '5',
      
      jam: data.jam || '-',
      labor_price: formatCurrency(data.labor_cost || 0),
      material_price: formatCurrency(data.material_cost || 0),
      total_price: formatCurrency(totalCost),
      remarks: data.remarks || '-',
      
      // Inspection loop
      inspections: inspectionsArray
    });

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // 4. Save DOCX file
    const docDir = path.join(__dirname, '../../public/docs');
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
    }

    const filename = `Quotation_${data.job_no}_${Date.now()}.docx`;
    const docPath = path.join(docDir, filename);
    const publicUrl = `/docs/${filename}`;

    fs.writeFileSync(docPath, buf);

    // 4.5 Auto-Convert DOCX to PDF using PowerShell (Windows native Word Interop)
    const pdfFilename = `Quotation_${data.job_no}_${Date.now()}.pdf`;
    const pdfPath = path.join(docDir, pdfFilename);
    let pdfUrl = null;
    
    try {
        const scriptPath = path.join(docDir, 'convert.ps1');
        const scriptContent = `
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 'wdAlertsNone'
try {
  $doc = $word.Documents.Open("${docPath}")
  $doc.SaveAs([ref]"${pdfPath}", [ref]17)
  $doc.Close()
} catch {
  Write-Error $_
} finally {
  $word.Quit()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
}
`;
        fs.writeFileSync(scriptPath, scriptContent);
        const { execSync } = require('child_process');
        execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, { windowsHide: true, timeout: 30000 });
        pdfUrl = `/docs/${pdfFilename}`;
        if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
    } catch (e) {
        console.error("Failed to generate PDF via PowerShell:", e);
    }

    // Base data object
    const baseData = {
        part_number: data.part_number,
        customer_name: data.customer_name,
        contact_person: data.contact_person,
        address: data.address,
        jam: data.jam,
        procedures: data.procedures || [],
        inspections: data.inspections || [],
        wo: data.wo,
        an: data.an,
        po: data.po,
        qty_in: parseInt(data.qty_in) || 1,
        date_in: new Date(data.date_in || Date.now()),
        unit_model: data.unit_model,
        part_description: data.part_description,
        remarks: data.remarks,
        labor_cost: parseFloat(data.labor_cost) || 0,
        material_cost: parseFloat(data.material_cost) || 0,
        estimated_completion: data.estimated_completion ? new Date(data.estimated_completion) : null,
        pdf_path: pdfUrl || publicUrl
    };

    const updateData = { ...baseData };
    if (imagesArray.length > 0) {
      updateData.images = imagesArray;
    }

    // 5. Save Record to Database (Upsert to support Edit Mode)
    const repairRecord = await prisma.repairs.upsert({
      where: { job_no: data.job_no },
      update: updateData,
      create: {
        ...baseData,
        job_no: data.job_no,
        images: imagesArray,
        status: 'In Progress' 
      }
    });

    await prisma.import_logs.create({
      data: {
        filename: filename,
        status: 'Generated',
        records_read: 1,
        user_id: userId
      }
    });

    return { repairRecord, docxUrl: publicUrl, pdfUrl: pdfUrl || publicUrl };
  }
}

module.exports = new QuotationService();
