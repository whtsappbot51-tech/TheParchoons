const cloudinary = require('cloudinary').v2;
const config = require('../config/config');

// Configure Cloudinary
const isConfigured = config.cloudinary.cloudName &&
  config.cloudinary.apiKey &&
  config.cloudinary.apiSecret;

if (isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  console.log('☁️ Cloudinary configured successfully.');
} else {
  console.warn('⚠️ Cloudinary not configured. Image uploads will fail.');
}

const cloudinaryService = {
  /**
   * Uploads an image buffer to Cloudinary.
   * @param {Buffer} fileBuffer - The image file buffer
   * @param {string} folder - Cloudinary folder path (e.g. 'theparchoons/products')
   * @returns {Promise<{url: string, publicId: string}>}
   */
  async uploadImage(fileBuffer, folder = 'theparchoons') {
    if (!isConfigured) {
      throw new Error('Cloudinary is not configured. Set CLOUDINARY_* env variables.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  },

  /**
   * Deletes an image from Cloudinary by its public ID.
   * @param {string} publicId
   */
  async deleteImage(publicId) {
    if (!isConfigured || !publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('Failed to delete image from Cloudinary:', err.message);
    }
  },
};

module.exports = cloudinaryService;
