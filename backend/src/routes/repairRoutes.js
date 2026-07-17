const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Repairs
 *   description: Repair data management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Repair:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         job_no:
 *           type: string
 *           example: "JN. 15991"
 *         part_number:
 *           type: string
 *           example: "HP-9912"
 *         customer_name:
 *           type: string
 *           example: "PT. Contoh Jaya"
 *         contact_person:
 *           type: string
 *           example: "Budi Santoso"
 *         address:
 *           type: string
 *           example: "Jl. Industri No. 1"
 *         unit_model:
 *           type: string
 *           example: "Mitsubishi FD35"
 *         part_description:
 *           type: string
 *           example: "Hydraulic Pump"
 *         qty_in:
 *           type: integer
 *           example: 1
 *         qty_out:
 *           type: integer
 *           example: 1
 *         date_in:
 *           type: string
 *           format: date-time
 *           example: "2026-07-13T00:00:00.000Z"
 *         date_out:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         status:
 *           type: string
 *           enum: [In Progress, Done, Overdue]
 *           example: "In Progress"
 *         labor_cost:
 *           type: number
 *           example: 500000
 *         material_cost:
 *           type: number
 *           example: 1500000
 *         jam:
 *           type: string
 *           example: "5 Jam"
 *         remarks:
 *           type: string
 *           nullable: true
 *         wo:
 *           type: string
 *           nullable: true
 *         an:
 *           type: string
 *           nullable: true
 *         repair_days:
 *           type: integer
 *           description: Calculated field - number of days the item has been in repair
 *           example: 5
 *         remaining_days:
 *           type: integer
 *           description: Calculated field - days remaining before overdue (standard is 12 days)
 *           example: 7
 *         pdf_path:
 *           type: string
 *           example: "/docs/Quotation_JN.15991_1720825200000.docx"
 *         created_at:
 *           type: string
 *           format: date-time
 */

// For Phase 5 testing, we can comment out requireAuth if auth is not yet hooked up in frontend,
// but according to PRD, access control is required.
// Manager & Viewer can GET. Admin can PUT.

/**
 * @swagger
 * /api/v1/repairs:
 *   get:
 *     summary: Get all repair records
 *     description: Returns a paginated list of repair records with calculated fields (repair_days, remaining_days). Supports search and status filtering.
 *     tags: [Repairs]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by job_no, customer_name, or unit_model
 *         example: "JN. 159"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [In Progress, Done, Overdue]
 *         description: Filter by repair status
 *         example: "In Progress"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: List of repair records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Repair'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 42
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *       500:
 *         description: Server error
 */
router.get('/', requireAuth, repairController.getAllRepairs);
router.get('/customers', requireAuth, repairController.getCustomers);

/**
 * @swagger
 * /api/v1/repairs/{id}:
 *   get:
 *     summary: Get a specific repair by Job Number
 *     description: Fetches a single repair record using the job_no as the identifier.
 *     tags: [Repairs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The job_no of the repair record
 *         example: "JN. 15991"
 *     responses:
 *       200:
 *         description: Repair record found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Repair'
 *       404:
 *         description: Repair record not found
 *       500:
 *         description: Server error
 */
router.get('/:id', requireAuth, repairController.getRepairById);

/**
 * @swagger
 * /api/v1/repairs/{id}:
 *   put:
 *     summary: Update a repair record
 *     description: |
 *       Updates operational fields of a repair record. Includes fields NOT available in QuotationForm
 *       (such as `po`, `remarks`, `soh`) which are filled by the Admin from the monitoring/detail page.
 *       Date out must be chronologically after date in.
 *     tags: [Repairs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The job_no of the repair record to update
 *         example: "JN. 15991"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [In Progress, Done]
 *                 example: "Done"
 *               qty_out:
 *                 type: integer
 *                 example: 1
 *               date_out:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-20"
 *               po:
 *                 type: string
 *                 description: Purchase Order number — diisi saat monitoring, bukan di QuotationForm
 *                 example: "PO-2026-001"
 *               remarks:
 *                 type: string
 *                 description: Catatan tambahan dari Admin — diisi saat monitoring
 *                 example: "Komponen siap, menunggu jadwal kirim"
 *               soh:
 *                 type: string
 *                 description: Stock on Hand — diisi saat monitoring
 *                 example: "Available"
 *     responses:
 *       200:
 *         description: Repair record updated successfully
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
 *                   example: Data perbaikan berhasil diperbarui
 *                 data:
 *                   $ref: '#/components/schemas/Repair'
 *       400:
 *         description: Date out is before date in
 *       404:
 *         description: Repair record not found
 *       500:
 *         description: Server error
 */
router.put('/:id', requireAuth, requireRole(['Admin', 'Super Admin']), repairController.updateRepair);

module.exports = router;
