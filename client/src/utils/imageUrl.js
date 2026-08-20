/**
 * Transforms a Cloudinary URL to serve optimized images.
 * Injects width, format, and quality transformations into the URL.
 *
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Transformation options
 * @param {number} options.width - Desired width (default: 400)
 * @param {number} options.height - Optional height
 * @param {string} options.crop - Crop mode (default: 'limit')
 * @returns {string} Optimized URL
 */
export const optimizedImageUrl = (url, { width = 400, height, crop = 'limit' } = {}) => {
  if (!url || !url.includes('cloudinary.com')) return url;

  // Cloudinary URL pattern: https://res.cloudinary.com/{cloud}/image/upload/{existing_transforms}/{path}
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  const base = url.substring(0, uploadIndex + 8); // includes '/upload/'
  const path = url.substring(uploadIndex + 8);

  // Remove any existing transformations (they start right after /upload/)
  // If path starts with v followed by digits, it's a version — keep it
  // If it starts with transformation params like w_, h_, c_, etc — strip them
  const cleanPath = path.replace(/^(w_|h_|c_|f_|q_|dpr_|e_|l_|t_)[^/]*\//, '');

  let transform = `w_${width},c_${crop},f_auto,q_auto`;
  if (height) transform += `,h_${height}`;

  return `${base}${transform}/${cleanPath}`;
};

// Presets for common use cases
export const productCardUrl = (url) => optimizedImageUrl(url, { width: 240, height: 180, crop: 'fill' });
export const productDetailUrl = (url) => optimizedImageUrl(url, { width: 600 });
export const bannerUrl = (url) => optimizedImageUrl(url, { width: 480, crop: 'fill' });
export const categoryUrl = (url) => optimizedImageUrl(url, { width: 96, height: 96, crop: 'fill' });
