const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.post('/google', authController.googleLogin);
router.get('/me', requireAuth, authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
