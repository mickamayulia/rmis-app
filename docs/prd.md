# 📄 MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Repair Monitoring Information System (RMIS)**

## 📑 1. Document Control & Metadata

* **Product Name:** Repair Monitoring Information System (RMIS)
* **Version:** 2.0.0 (Master Production-Ready Spec)
* **Status:** Approved for Development / Specification Phase
* **Author:** Micka Mayulia Utama
* **Client / Organization:** PT Raf Robian Pratama
* **Industry Domain:** Heavy Equipment Component Repair
* **Project Category:** Management & Decision Support Information System (Internship Project / Kerja Praktik)

---

## 📌 2. Executive Summary & Product Vision

### 2.1 Vision

To transform the management of heavy equipment component repair monitoring from an isolated manual spreadsheet ecosystem into a centralized, intelligent, data-driven web platform. This platform is designed to eliminate repetitive administrative workloads through automated document generation while functioning as a secure and responsive Decision Support System (DSS) for operations.

### 2.2 Core Objectives

* **Document Automation:** Standardize and automate the generation of Quotation Forms and Component Pre-Inspection Reports into a single unified DOCX output via a digital web form.
* **Centralized Security:** Secure operational data accessibility through the company's built-in Google Workspace Single Sign-On (SSO) system, eliminating the need for independent password management.
* **Visibility Optimization:** Provide an interactive analytics dashboard that presents real-time operational metrics to minimize component handling delays (overdue), strictly monitored with a 12-day SLA.

---

## 🚨 3. Problem Statement & Context

Current internal business processes create significant operational bottlenecks:

1. **Manual Document Creation:** Creating Quotation Forms and Pre-Inspection Reports manually takes significant time and often results in inconsistent formatting.
2. **Low Administrative Scalability:** As the volume of component repair orders increases, tracking and managing the status of these orders in fragmented spreadsheets becomes difficult.
3. **Data Integrity Vulnerability:** Fragmented data sources increase the risk of discrepancies in critical fields such as Job Number, Part Number, and Component Descriptions.
4. **Delayed Visibility:** Monitoring component processing performance that relies on local documents makes it difficult for management to track repair history status, analyze delays, or generate aggregate reports quickly.

---

## 👥 4. User Personas & Role-Based Access Control (RBAC)

The system implements strict access rights restrictions using token-based role control:

| User Role | Operational Description | Core Feature Access Rights |
| --- | --- | --- |
| **Super Admin** | *System Maintainer* / Developer responsible for application health. | - Manage user account authorization.<br><br>- Elevate or demote user role levels (role mapping).<br><br>- Monitor system logs and basic configurations. |
| **Admin (PPC Staff)** | Main Operator (Production Planning & Control) processing the repair data flow. | - Authentication via Google SSO.<br><br>- Fill out and generate Quotation Forms (DOCX).<br><br>- Full control over repair data manipulation (CRUD Repairs).<br><br>- Update Monitoring Table (PO, SOH, Qty Out). |
| **Manager & Viewer** | Decision-makers and management team needing analytical data (Read-Only). | - Access the Main Dashboard and statistical chart components.<br><br>- Perform advanced search and filtering.<br><br>- Export repair data into Excel or PDF reports.<br><br>- *Restricted:* Cannot create or edit repair entries. |

---

## ⚙️ 5. Functional Feature Specification

### 5.1 Google Workspace Authentication Module (SSO)

* **Integrated Mechanism:** Authentication using the OAuth 2.0 protocol. Users only need a single click on the "Login with Google" button using their official company email.
* **Auto-Provisioning:** New account registration occurs automatically when an email with the official domain logs into the system for the first time, with the default role set as **Manager / Viewer**.

### 5.2 Dashboard & History Monitoring Module (DSS Dashboard)

* **Summary Cards:** Displays aggregate metrics including Total Active Projects, Completed Components, In-Repair Accumulation, and Total Overdue Components.
* **Interactive Charts:** Provides monthly trend charts and component repair status distribution.
* **Overdue Alert Table:** Presents a dedicated list of components whose processing duration has exceeded the 12-day standard time limit so they can be followed up immediately.

### 5.3 Quotation & Pre-Inspection DOCX Generator Module (Core Feature)

* **Comprehensive Digital Form:** A web interface allowing Admins to input comprehensive repair data.
* **Unified Document Output:** The system uses `docxtemplater` to map the input data into a unified, standardized DOCX document containing both the **Quotation Form** and the **Component Pre-Inspection Report**.
* **Dynamic Attachments:** Supports uploading 2 to 6 images per transaction, which will be embedded automatically at the bottom section of the generated document.
* **Static Legal Sections:** "Standard Term & Condition" and signatures (Director, QA/QC) are statically embedded within the DOCX template to maintain consistency without manual data entry.

### 5.4 12-Day SLA Repair Monitoring Module

* **Monitoring Table:** A centralized view displaying critical SLA fields for tracking repair progress.
* **Post-Creation Updates:** Specific fields like **Purchase Order (PO)**, **Stock On Hand (SOH)**, and **Jumlah Out (Qty Out)** are intentionally left out of the generation form and must be updated progressively by the Admin via the monitoring module (e.g., PO is updated *only* when the customer has paid).
* **Advanced Search Engine:** Responsive Full-Text Search on Job Number, Unit Model, or Customer Name columns.

### 5.5 Reporting Module (Export Engine)

* **Tabular Data Exporter:** Converts rows of repair data that have been filtered based on specific parameters into Microsoft Excel (.xlsx) spreadsheets or PDF documents.

---

## 🛠️ 6. Technical Architecture & Tech Stack

* **Frontend SPA Engine:** **React.js** – Responsible for reactive interface rendering, centralized state management, and client-side routing. Uses `@hookform/resolvers/zod` for robust form validation.
* **Backend REST API Engine:** **Node.js (Express.js)** – Provides REST API services. Uses `docxtemplater` and `pizzip` to process DOCX generation in-memory.
* **Database Engine:** **PostgreSQL 17** managed via Prisma ORM.
* **Security Protocol:** JWT cookies with `httpOnly`, `secure`, and `sameSite=Strict` attributes.

---

## 📊 7. Database Schema & Data Structure

### 7.1 Core Table List

1. **users:** Stores corporate Google account profile identity information and user access role levels.
2. **repairs:** The master table accommodating all fields required for DOCX generation and ongoing SLA monitoring.
3. **import_logs:** Records document generation audit logs.

### 7.2 Data Mapping Rules (QF Form vs Monitoring)

The `repairs` table holds a superset of fields. The data is logically separated based on when it is acquired in the business process.

#### A. Fields Input During Document Generation (Quotation Form & Pre-Inspection Report)
These fields are filled out by the Admin initially to generate the DOCX document.

* **Header & Component Info:**
  * `job_no` (Varchar, PK)
  * `customer_name` (Varchar) - Same as Company/USER.
  * `contact_person` (Varchar)
  * `address` (Text)
  * `date_in` (DateTime)
  * `wo` (Varchar)
  * `an` (Varchar)
  * `part_description` (Varchar)
  * `unit_model` (Varchar)
  * `part_number` (Varchar)
  * `qty_in` (Integer)
* **Pricing & SLA Est:**
  * `jam` (Varchar) - Estimated working hours/description.
  * `labor_cost` (Float)
  * `material_cost` (Float)
  * `estimated_completion` (DateTime)
  * `remarks` (Text) - Comments/Remarks.
* **Procedures & Inspections (Stored as JSON):**
  * `procedures` (JSON) - List of repair procedures.
  * `inspections` (JSON) - Dismantle Results Table containing: Check Point (List), Condition (List), Measurement X, Y, Z (Before/After), and Measure (List).
  * `images` (JSON) - Mapping of 2 to 6 uploaded images.
* **System Field:**
  * `pdf_path` (Varchar) - URL path to the generated `.docx` file.

#### B. Fields Updated Later During Monitoring
These fields do NOT appear on the Quotation Generation form. They are updated exclusively via the Monitoring Dashboard.

* `po` (Varchar) - Filled **only** when the customer has made a payment.
* `qty_out` (Integer) - Filled when components are dispatched.
* `date_out` (DateTime) - Filled when work is completed.
* `soh` (Varchar) - Stock On Hand status.
* `status` (Varchar) - Current progress status (e.g., In Progress, Completed, Overdue).

#### C. Calculated Monitoring Fields (Calculated dynamically, not physically stored)
* `repair_days`: Count Jumlah Hari Pengerjaan.
* `remaining_days`: Count Sisa Hari dari 12 Hari / Kelebihan hari (Overdue).

---

## 📐 8. Business Logic & Validation Rules

### 8.1 Repair Duration Calculation Rules (Repair Days)

Processing duration is calculated automatically in real-time based on dates:

$$\text{Repair Days} = \text{Date Out} - \text{Date In}$$

If the component repair process is still ongoing in the workshop (Date Out is Empty/Null), the formula automatically switches to using today's date:

$$\text{Repair Days} = \text{Today's Date} - \text{Date In}$$

### 8.2 The 12-Day SLA Overdue Detection

* **Standard Rule:** The standard safe processing time is 12 days.
* **Remaining Days calculation:** $12 - \text{Repair Days}$.
* **Action:** If the $\text{Repair Days}$ value exceeds **12 Days** while the status is not "Completed", the system automatically flags the row status as **Overdue** and pushes it to the warning table on the management dashboard.

### 8.3 PO and Date Validations

* **Purchase Order (PO) Rule:** The PO column on the monitoring table remains empty initially and is only unlocked/filled by the Admin once customer payment has been confirmed.
* **Chronology Rule:** Updates to the monitoring table are rejected if the `date_out` is recorded earlier than `date_in`.

---

## 🛣️ 9. UI/UX Routes & REST API Core Specification

### 9.1 Client Application (React SPA Client-Side Routes)

* `/login` $\rightarrow$ Main authorization page.
* `/dashboard` $\rightarrow$ Analytics dashboard & overdue alerts (Access: All Roles).
* `/quotations/new` $\rightarrow$ Comprehensive form interface to generate DOCX Quotations and Pre-Inspection Reports (Restricted Access: Admin).
* `/repairs` $\rightarrow$ The 12-Day SLA Monitoring Table. Includes the full list of fields including PO, SOH, and Date calculations (Access: All Roles).
* `/repairs/:id` $\rightarrow$ Detail view and update form to input PO, Qty Out, SOH, and Date Out (Restricted Edit Access: Admin).
* `/reports` $\rightarrow$ Filter panel to export data (Excel/PDF) (Access: Admin & Manager).

### 9.2 API Endpoints (Node.js REST Services)

* `POST /api/v1/auth/google` $\rightarrow$ OAuth exchange & issues internal JWT.
* `POST /api/v1/quotations/generate` $\rightarrow$ Receives `multipart/form-data` payload (form fields + 2-6 images), generates the unified DOCX via `docxtemplater`, saves it locally, and stores the initial record into the `repairs` table.
* `GET /api/v1/repairs` $\rightarrow$ Fetches component repair data, applying real-time calculation for `repair_days` and `remaining_days`.
* `PUT /api/v1/repairs/:id` $\rightarrow$ Updates monitoring fields (e.g., PO, SOH, Qty Out, Date Out) for an existing job.

---

## 🛡️ 10. Unified Error Handling Matrix

| Category | Validation Code | Application Error Message | System Handling Action |
| --- | --- | --- | --- |
| **Form Validation** | `FORM001` | "Job Number wajib diisi" | Handled by Zod client-side; prevents submission until required fields are met. |
| **Document Gen** | `DOC001` | "Gagal memproses template dokumen" | Server catches `docxtemplater` parsing errors, aborts DB insertion, and returns 500. |
| **Document Gen** | `IMG001` | "Format gambar tidak didukung" | Rejects unsupported image formats during upload buffering. |
| **Database** | `DB001` | "Gagal menyimpan data repair" | Rolls back the process if DB is unreachable. |
| **Database** | `DB002` | "Job Number sudah ada" | Prisma Unique Constraint violation; alerts Admin that JN already exists. |

---

## 🧪 11. Quality Assurance & Manual Testing Plan

1. **Document Generation Scenarios:**
* *Successful Generation:* Fill all mandatory fields and attach 4 images. Ensure the API returns a success message and a clickable link to a fully rendered DOCX containing both Quotation and Pre-Inspection components.
* *Form Validation Check:* Attempt to submit the form without filling `job_no` or `part_number`. Ensure Zod validation halts the action.

2. **Monitoring & SLA Scenarios:**
* *Update Monitoring Fields:* From the monitoring table, successfully update a record to include a PO number and SOH without affecting the previously stored JSON procedures.
* *Overdue Trigger:* Create a mock record with a `date_in` of 15 days ago and no `date_out`. Ensure it appears highlighted as "Overdue" in the dashboard.

---
