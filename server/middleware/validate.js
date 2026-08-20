const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware that checks validation results and returns errors if any.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    return res.status(400).json({ success: false, error: messages[0], errors: messages });
  }
  next();
};

// --- Order Creation ---
const validateOrderCreation = [
  body('name').trim().notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
  body('phone').trim().notEmpty().withMessage('Phone number is required.')
    .matches(/^[0-9]{10,12}$/).withMessage('Phone must be 10-12 digits.'),
  body('address').trim().notEmpty().withMessage('Address is required.')
    .isLength({ min: 3, max: 500 }).withMessage('Address must be 3-500 characters.'),
  body('cart').isArray({ min: 1 }).withMessage('Cart must have at least 1 item.'),
  body('cart.*.productId').isMongoId().withMessage('Invalid product ID in cart.'),
  body('cart.*.variantId').notEmpty().withMessage('Variant ID is required.'),
  body('cart.*.quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be 1-99.'),
  body('paymentMethod').optional().isIn(['cod']).withMessage('Only COD is supported.'),
  handleValidationErrors,
];

// --- Add Items to Order ---
const validateAddItems = [
  param('orderId').trim().notEmpty().withMessage('Order ID is required.'),
  body('cart').isArray({ min: 1 }).withMessage('Cart must have at least 1 item.'),
  body('cart.*.productId').isMongoId().withMessage('Invalid product ID.'),
  body('cart.*.variantId').notEmpty().withMessage('Variant ID is required.'),
  body('cart.*.quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be 1-99.'),
  handleValidationErrors,
];

// --- Finalize Order ---
const validateFinalize = [
  param('orderId').trim().notEmpty().withMessage('Order ID is required.'),
  body('phone').trim().notEmpty().withMessage('Phone is required for verification.')
    .matches(/^[0-9]{10,12}$/).withMessage('Invalid phone number.'),
  handleValidationErrors,
];

// --- Admin Category ---
const validateCategory = [
  body('name').trim().notEmpty().withMessage('Category name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean.'),
  handleValidationErrors,
];

// --- Admin Product ---
const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required.')
    .isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters.'),
  body('category').isMongoId().withMessage('Invalid category ID.'),
  body('variants').isArray({ min: 1 }).withMessage('At least 1 variant required.'),
  body('variants.*.name').trim().notEmpty().withMessage('Variant name is required.'),
  body('variants.*.price').isFloat({ min: 0 }).withMessage('Price must be non-negative.'),
  handleValidationErrors,
];

// --- Admin Banner ---
const validateBanner = [
  body('image').trim().notEmpty().withMessage('Banner image URL is required.'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be non-negative.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean.'),
  handleValidationErrors,
];

// --- Admin Settings ---
const validateSettings = [
  body('settings').isArray({ min: 1 }).withMessage('Settings must be an array.'),
  body('settings.*.key').trim().notEmpty().withMessage('Setting key is required.'),
  body('settings.*.value').exists().withMessage('Setting value is required.'),
  handleValidationErrors,
];

// --- Param ID validation ---
const validateMongoId = [
  param('id').isMongoId().withMessage('Invalid ID format.'),
  handleValidationErrors,
];

module.exports = {
  validateOrderCreation,
  validateAddItems,
  validateFinalize,
  validateCategory,
  validateProduct,
  validateBanner,
  validateSettings,
  validateMongoId,
};
