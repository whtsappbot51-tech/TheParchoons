const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const uploadMiddleware = require('../middleware/upload.middleware');
const cloudinaryService = require('../services/cloudinary.service');

// Protect upload routes
router.use(authMiddleware);

// POST /api/admin/upload — Upload single image to Cloudinary
router.post('/upload', uploadMiddleware.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    // Determine folder based on query param (e.g., ?type=product)
    const type = req.query.type || 'misc';
    const folder = `theparchoons/${type}`;

    const result = await cloudinaryService.uploadImage(req.file.buffer, folder);

    res.status(200).json({
      success: true,
      url: result.url,
      publicId: result.publicId
    });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'Failed to upload image.' });
  }
});

// DELETE /api/admin/upload — Delete image from Cloudinary
router.delete('/upload', async (req, res) => {
    try {
        const { publicId } = req.body;
        if (!publicId) {
            return res.status(400).json({ error: 'Public ID is required.' });
        }
        await cloudinaryService.deleteImage(publicId);
        res.json({ success: true });
    } catch (err) {
        console.error('Image delete error:', err);
        res.status(500).json({ error: 'Failed to delete image.' });
    }
});

module.exports = router;
