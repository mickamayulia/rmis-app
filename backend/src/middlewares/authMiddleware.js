const jwt = require('jsonwebtoken');

exports.requireAuth = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Sesi tidak ditemukan. Silakan login kembali.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_fallback');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Token tidak valid atau kedaluwarsa.' });
  }
};

exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Anda tidak memiliki hak akses untuk fitur ini.' });
    }
    next();
  };
};
