const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files (for generated PDFs and DOCXs)
app.use('/pdfs', express.static(path.join(__dirname, '../public/pdfs')));
app.use('/docs', express.static(path.join(__dirname, '../public/docs')));

// Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RMIS API Docs',
}));

// Routes
const authRoutes = require('./routes/authRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const repairRoutes = require('./routes/repairRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/repairs', repairRoutes);

// Basic Route
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'RMIS API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
