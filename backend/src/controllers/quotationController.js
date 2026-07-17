const quotationService = require('../services/quotationService');

exports.generateQuotation = async (req, res) => {
  try {
    const formData = { ...req.body };
    
    // Parse JSON strings sent via FormData
    if (formData.procedures) {
      try { formData.procedures = JSON.parse(formData.procedures); } catch (e) { formData.procedures = []; }
    }
    if (formData.inspections) {
      try { formData.inspections = JSON.parse(formData.inspections); } catch (e) { formData.inspections = []; }
    }

    // Attach uploaded files to formData (limit to max 6 images)
    formData.uploadedImages = (req.files || []).slice(0, 6);

    // Default userId to 1 if auth middleware is not yet implemented fully
    const userId = req.user ? req.user.id : 1; 

    // Validate minimum required fields
    if (!formData.job_no || !formData.part_number) {
      return res.status(400).json({
        status: 'error',
        message: 'Job Number and Part Number are required'
      });
    }

    const result = await quotationService.generateAndSave(formData, userId);

    return res.status(201).json({
      status: 'success',
      message: 'Quotation generated and saved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error generating quotation:', error);
    return res.status(500).json({
      status: 'error',
      code: 'DB001',
      message: 'Gagal memproses Quotation / menyimpan data repair'
    });
  }
};
