// routes/upload.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'media');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to slugify filenames
const slugifyFilename = (filename) => {
  // Get the base name and extension
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);
  
  // Convert to lowercase and normalize
  let slugified = baseName
    .toLowerCase()
    // Replace Turkish characters
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    // Replace spaces and special characters with underscores
    .replace(/[\s\-_\.]+/g, '_')
    // Remove any remaining special characters except alphanumeric and underscores
    .replace(/[^a-z0-9_]/g, '')
    // Remove multiple consecutive underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');
  
  // If slugified name is empty, use 'file'
  if (!slugified) {
    slugified = 'file';
  }
  
  return slugified;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with slugified name, timestamp and random string
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD format
    const randomString = Math.random().toString(36).substring(2, 8); // 6 character random string
    const extension = path.extname(file.originalname);
    const slugifiedName = slugifyFilename(file.originalname);
    const filename = `${slugifiedName}_${timestamp}_${randomString}${extension}`;
    cb(null, filename);
  }
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/svg+xml': ['.svg'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/ogg': ['.ogg'],
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg'],
    'audio/mp4': ['.m4a']
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Helper function to get file type category
const getFileCategory = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'unknown';
};

/**
 * @swagger
 * /api/upload-media:
 *   post:
 *     tags: [Media]
 *     summary: Upload media files
 *     description: Upload image, video, or audio files for stories
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Media file to upload
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 url:
 *                   type: string
 *                   example: "/uploads/media/image_1234567890_abc123.jpg"
 *                 filename:
 *                   type: string
 *                   example: "image_1234567890_abc123.jpg"
 *                 category:
 *                   type: string
 *                   example: "image"
 *                 size:
 *                   type: number
 *                   example: 1024000
 *       400:
 *         description: Bad request - invalid file type or size
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/media', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'BAD_REQUEST',
        message: 'No file uploaded' 
      });
    }

    const file = req.file;
    const category = getFileCategory(file.mimetype);
    
    // Generate the public URL path
    const publicUrl = `/uploads/media/${file.filename}`;

    // Log the upload for admin tracking
    console.log(`Media uploaded: ${file.filename} (${category}, ${file.size} bytes)`);

    res.json({
      ok: true,
      url: publicUrl,
      filename: file.filename,
      category: category,
      size: file.size,
      mimetype: file.mimetype
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'BAD_REQUEST',
        message: 'File too large. Maximum size is 50MB.' 
      });
    }
    
    if (error.message.includes('File type')) {
      return res.status(400).json({ 
        error: 'BAD_REQUEST',
        message: error.message 
      });
    }

    res.status(500).json({ 
      error: 'SERVER_ERROR',
      message: 'Failed to upload file' 
    });
  }
});

export default router;
