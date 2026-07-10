const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const multer = require('multer');

// Configure multer for memory storage (files will be kept in memory buffer)
// This is because docxtemplater-image-module-free can work directly with buffers
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/v1/quotations/generate
// Protected route (ideally handled by auth middleware, left open for testing Phase 2)
router.post('/generate', upload.array('images'), quotationController.generateQuotation);

module.exports = router;
