const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// For Phase 5 testing, we can comment out requireAuth if auth is not yet hooked up in frontend,
// but according to PRD, access control is required. 
// Manager & Viewer can GET. Admin can PUT.

// GET /api/v1/repairs - Get all repairs (with dynamic search, pagination, and calculated fields)
router.get('/', repairController.getAllRepairs);

// GET /api/v1/repairs/:id - Get specific repair
router.get('/:id', repairController.getRepairById);

// PUT /api/v1/repairs/:id - Update repair details (Admin only ideally)
// Example with middleware: router.put('/:id', requireAuth, requireRole(['Admin', 'Super Admin']), repairController.updateRepair);
router.put('/:id', repairController.updateRepair);

module.exports = router;
