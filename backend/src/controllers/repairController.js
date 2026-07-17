const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllRepairs = async (req, res) => {
  try {
    const { search, status, customer, page = 1, limit = 50 } = req.query;
    
    // Pagination logic
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build query conditions
    const whereCondition = {};
    
    if (customer) {
      whereCondition.customer_name = customer;
    }
    
    // Notice: we DO NOT filter by status here in DB because 'Overdue' is calculated dynamically.
    if (search) {
      whereCondition.OR = [
        { job_no: { contains: search, mode: 'insensitive' } },
        { customer_name: { contains: search, mode: 'insensitive' } },
        { unit_model: { contains: search, mode: 'insensitive' } },
        { part_number: { contains: search, mode: 'insensitive' } },
        { part_description: { contains: search, mode: 'insensitive' } },
        { wo: { contains: search, mode: 'insensitive' } },
        { an: { contains: search, mode: 'insensitive' } },
        { po: { contains: search, mode: 'insensitive' } }
      ];
    }

    const rawRepairs = await prisma.repairs.findMany({
      where: whereCondition,
      orderBy: { created_at: 'desc' }
    });

    const today = new Date();
    
    // Enrich with dynamic fields
    const enrichedRepairs = rawRepairs.map(repair => {
      const dateIn = new Date(repair.date_in);
      const dateOut = repair.date_out ? new Date(repair.date_out) : today;
      
      const diffTime = Math.abs(dateOut - dateIn);
      const repairDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const standardDays = 12;
      const remainingDays = standardDays - repairDays;
      
      let currentStatus = repair.status;
      
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

    // Apply Status Filter in Memory
    const filteredRepairs = status 
      ? enrichedRepairs.filter(r => r.status === status)
      : enrichedRepairs;

    // Apply Pagination in Memory
    const total = filteredRepairs.length;
    const paginatedRepairs = filteredRepairs.slice(skip, skip + take);

    return res.status(200).json({
      status: 'success',
      data: paginatedRepairs,
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
        // Fields updatable from monitoring/detail page
        qty_out: updateData.qty_out !== undefined ? parseInt(updateData.qty_out) : undefined,
        date_out: updateData.date_out ? new Date(updateData.date_out) : undefined,
        status: updateData.status !== undefined ? updateData.status : undefined,

        // Fields that are NOT in QuotationForm — diisi oleh Admin saat monitoring
        po: updateData.po !== undefined ? updateData.po : undefined,
        remarks: updateData.remarks !== undefined ? updateData.remarks : undefined,
        soh: updateData.soh !== undefined ? updateData.soh : undefined,
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

exports.getCustomers = async (req, res) => {
  try {
    const customers = await prisma.repairs.findMany({
      select: { customer_name: true },
      distinct: ['customer_name'],
      where: {
        customer_name: { not: null }
      },
      orderBy: { customer_name: 'asc' }
    });
    
    const customerNames = customers
      .map(c => c.customer_name)
      .filter(name => name && name.trim() !== '');

    return res.status(200).json({
      status: 'success',
      data: customerNames
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memuat data pelanggan'
    });
  }
};
