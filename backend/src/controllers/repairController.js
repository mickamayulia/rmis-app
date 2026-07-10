const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllRepairs = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    
    // Pagination logic
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build query conditions
    const whereCondition = {};
    
    if (status) {
      whereCondition.status = status;
    }
    
    if (search) {
      whereCondition.OR = [
        { job_no: { contains: search, mode: 'insensitive' } },
        { customer_name: { contains: search, mode: 'insensitive' } },
        { unit_model: { contains: search, mode: 'insensitive' } }
      ];
    }

    const repairs = await prisma.repairs.findMany({
      where: whereCondition,
      skip,
      take,
      orderBy: { created_at: 'desc' }
    });

    const total = await prisma.repairs.count({ where: whereCondition });

    // Calculate dynamic fields: repair_days, remaining_days, and update overdue status
    const today = new Date();
    
    const enrichedRepairs = repairs.map(repair => {
      const dateIn = new Date(repair.date_in);
      const dateOut = repair.date_out ? new Date(repair.date_out) : today;
      
      // Hitung selisih hari pengerjaan
      const diffTime = Math.abs(dateOut - dateIn);
      const repairDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Ambil standar 12 hari (sesuai PRD)
      const standardDays = 12;
      const remainingDays = standardDays - repairDays;
      
      let currentStatus = repair.status;
      
      // Overdue Automation Display (Jika lebih dari 12 hari kerja dan belum selesai)
      if (repairDays > standardDays && repair.status === 'In Progress') {
        currentStatus = 'Overdue';
      }

      return {
        ...repair,
        repair_days: repairDays,
        remaining_days: remainingDays,
        status: currentStatus
      };
    });

    return res.status(200).json({
      status: 'success',
      data: enrichedRepairs,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    });

  } catch (error) {
    console.error('Error fetching repairs:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data perbaikan' });
  }
};

exports.getRepairById = async (req, res) => {
  try {
    const { id } = req.params; // job_no
    const repair = await prisma.repairs.findUnique({ where: { job_no: id } });
    
    if (!repair) {
      return res.status(404).json({ status: 'error', message: 'Data perbaikan tidak ditemukan' });
    }

    return res.status(200).json({ status: 'success', data: repair });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

exports.updateRepair = async (req, res) => {
  try {
    const { id } = req.params; // job_no
    const updateData = req.body;

    // Validate Chronological Dates
    if (updateData.date_out) {
      const repairCheck = await prisma.repairs.findUnique({ where: { job_no: id } });
      if (!repairCheck) return res.status(404).json({ status: 'error', message: 'Not found' });
      
      if (new Date(updateData.date_out) < new Date(repairCheck.date_in)) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Tanggal keluar (Date Out) tidak valid karena lebih awal dari tanggal masuk.' 
        });
      }
    }

    const updatedRepair = await prisma.repairs.update({
      where: { job_no: id },
      data: {
        qty_out: updateData.qty_out ? parseInt(updateData.qty_out) : undefined,
        date_out: updateData.date_out ? new Date(updateData.date_out) : undefined,
        remarks: updateData.remarks,
        status: updateData.status
      }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Data perbaikan berhasil diperbarui',
      data: updatedRepair
    });
  } catch (error) {
    console.error('Error updating repair:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal memperbarui data' });
  }
};
