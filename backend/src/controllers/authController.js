const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: google_id } = payload;

    // Domain Restriction Check (SSO)
    const allowedDomain = process.env.ALLOWED_CORPORATE_DOMAIN;
    if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
      return res.status(403).json({
        status: 'error',
        message: `Akses ditolak. Silakan gunakan email dengan domain @${allowedDomain}`
      });
    }

    // Upsert User
    let user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.users.create({
        data: {
          google_id,
          email,
          name,
          role: 'Manager' // Default role
        }
      });
    }

    // Generate internal JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_fallback',
      { expiresIn: '24h' }
    );

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil login',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal melakukan autentikasi' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true }
    });
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    return res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ status: 'success', message: 'Berhasil logout' });
};

exports.mockLogin = async (req, res) => {
  try {
    const email = 'admin@rafrobian.com';
    let user = await prisma.users.findUnique({ where: { email } });
    
    // Create mock admin if doesn't exist
    if (!user) {
      user = await prisma.users.create({
        data: {
          google_id: 'mock-google-id-123',
          email,
          name: 'Admin RMIS',
          role: 'Admin'
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_fallback',
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil login (Mock)',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Mock Auth Error:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal melakukan mock autentikasi' });
  }
};
