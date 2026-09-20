// upload.js — Secure image upload endpoint with MIME and size validation
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Ensure upload directory exists safely (supports serverless read-only filesystems)
const isVercel = Boolean(process.env.VERCEL);
const uploadDir = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, '../../public/uploads');
let useDiskStorage = false;

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  useDiskStorage = true;
} catch (err) {
  console.warn('Serverless read-only disk detected, switching to memory storage:', err.message);
  useDiskStorage = false;
}

// Multer storage configuration
const storage = useDiskStorage
  ? multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `artwork-${uniqueSuffix}${ext}`);
      }
    })
  : multer.memoryStorage();

// File filter (MIME validation)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, AVIF, and GIF are permitted.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum
  }
});

// Upload endpoint (auth required)
router.post('/', auth, uploadLimiter, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    if (req.file.buffer) {
      const b64 = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      return res.json({
        url: dataUri,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Image upload failed' });
  }
});

module.exports = router;
