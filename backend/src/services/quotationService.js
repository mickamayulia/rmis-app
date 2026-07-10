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
    let measureXml = proceduresList.map(p => `<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:t>${p.list}. ${p.desc}</w:t></w:r></w:p>`).join('');
    if (!measureXml) measureXml = '<w:p><w:r><w:t>-</w:t></w:r></w:p>';

    // Map inspections properly for docxtemplater row loops
    const inspectionsArray = data.inspections && data.inspections.length > 0
      ? data.inspections.map((insp, index) => {
          let conditionXml = '';
          if (insp.condition) {
              conditionXml += `<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:t>${insp.condition}</w:t></w:r></w:p>`;
          }
          
          if (insp.x_before || insp.x_after || insp.y_before || insp.y_after || insp.z_before || insp.z_after) {
              conditionXml += `
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="0" w:type="auto"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tr>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="D9D9D9"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Axis</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="D9D9D9"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Before</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="D9D9D9"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>After</w:t></w:r></w:p></w:tc>
  </w:tr>
  <w:tr>
    <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>X</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:t>${insp.x_before || '-'}</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:t>${insp.x_after || '-'}</w:t></w:r></w:p></w:tc>
  </w:tr>
  <w:tr>
    <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Y</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:t>${insp.y_before || '-'}</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:t>${insp.y_after || '-'}</w:t></w:r></w:p></w:tc>
  </w:tr>
  <w:tr>
    <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Z</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:t>${insp.z_before || '-'}</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:t>${insp.z_after || '-'}</w:t></w:r></w:p></w:tc>
  </w:tr>
</w:tbl>`;
          }
          if (!conditionXml) conditionXml = '<w:p><w:r><w:t>-</w:t></w:r></w:p>';
          
          return {
              no: index + 1,
              check_point: insp.check_point || '-',
              condition: conditionXml,
              measure: measureXml,
              // if deskripsi is not filled, don't show undefined or dash
              deskripsi: (insp.deskripsi && insp.deskripsi.trim() !== '' && insp.deskripsi !== 'undefined') ? insp.deskripsi : ''
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
      
      jam: data.jam || '-',
      labor_price: formatCurrency(data.labor_cost || 0),
      material_price: formatCurrency(data.material_cost || 0),
      total_price: formatCurrency(totalCost),
      
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

    // 5. Save Record to Database
    const repairRecord = await prisma.repairs.create({
      data: {
        job_no: data.job_no,
        part_number: data.part_number,
        customer_name: data.customer_name,
        contact_person: data.contact_person,
        address: data.address,
        jam: data.jam,
        procedures: data.procedures || [],
        inspections: data.inspections || [],
        images: imagesArray, // Store mapping in DB, real files could be uploaded to S3/Cloudinary in future
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
        pdf_path: publicUrl, // Storing DOCX path in the same column for now
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

    return { repairRecord, pdfUrl: publicUrl }; // Returning pdfUrl key so frontend doesn't break, though it's a docx
  }
}

module.exports = new QuotationService();
