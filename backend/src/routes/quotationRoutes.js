const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const multer = require('multer');
const { requireAuth } = require('../middlewares/authMiddleware');

// Configure multer for memory storage (files will be kept in memory buffer)
// This is because docxtemplater-image-module-free can work directly with buffers
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Quotation
 *   description: Quotation generation endpoints
 */

/**
 * @swagger
 * /api/v1/quotations/generate:
 *   post:
 *     summary: Generate a Quotation DOCX
 *     description: |
 *       Generates a Quotation document (.docx) from the provided form data, saves it to disk, 
 *       and stores the repair record in the database.
 *       Accepts `multipart/form-data` because images can be uploaded along with the form fields.
 *     tags: [Quotation]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - job_no
 *               - part_number
 *               - date_in
 *               - qty_in
 *             properties:
 *               job_no:
 *                 type: string
 *                 description: Unique job number (e.g. JN. 15991)
 *                 example: "JN. 15991"
 *               date_in:
 *                 type: string
 *                 format: date
 *                 description: Date the item came in
 *                 example: "2026-07-13"
 *               customer_name:
 *                 type: string
 *                 example: "PT. Contoh Jaya"
 *               contact_person:
 *                 type: string
 *                 example: "Budi Santoso"
 *               address:
 *                 type: string
 *                 example: "Jl. Industri No. 1, Jakarta"
 *               wo:
 *                 type: string
 *                 description: Work Order reference
 *                 example: "WO-001"
 *               an:
 *                 type: string
 *                 description: AN reference
 *                 example: "AN-001"
 *               unit_model:
 *                 type: string
 *                 example: "Mitsubishi FD35"
 *               part_description:
 *                 type: string
 *                 example: "Hydraulic Pump"
 *               part_number:
 *                 type: string
 *                 example: "HP-9912"
 *               qty_in:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               labor_cost:
 *                 type: number
 *                 example: 500000
 *               material_cost:
 *                 type: number
 *                 example: 1500000
 *               jam:
 *                 type: string
 *                 description: Estimated working hours
 *                 example: "5 Jam"
 *               remarks:
 *                 type: string
 *                 description: Additional notes
 *                 example: "Garansi 1 bulan"
 *               procedures:
 *                 type: string
 *                 description: JSON string of procedures array, or plain newline-separated text
 *                 example: "1. Dismantle\n2. Inspect\n3. Repair"
 *               inspections:
 *                 type: string
 *                 description: JSON string of inspections array
 *                 example: "[{\"check_point\":\"Shaft\",\"x_before\":\"0.1\",\"x_after\":\"0.0\"}]"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 2 images to embed in the document
 *     responses:
 *       201:
 *         description: Quotation successfully generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Quotation generated and saved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     pdfUrl:
 *                       type: string
 *                       example: /docs/Quotation_JN.15991_1720825200000.docx
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Job Number already exists (DB002)
 *       500:
 *         description: Server error while processing (DB001)
 */
router.post('/generate', requireAuth, upload.array('images'), quotationController.generateQuotation);

module.exports = router;
