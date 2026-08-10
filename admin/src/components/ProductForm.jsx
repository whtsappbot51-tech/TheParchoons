import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import api from '../api';
import './ProductForm.css';

const ProductForm = ({ isOpen, onClose, productToEdit, categories, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [variantImageFiles, setVariantImageFiles] = useState({});
  const [uploading, setUploading] = useState(false);

  const initialVariant = { name: '', price: '', mrp: '', sku: '', inStock: true, image: '' };
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    description: '',
    image: '',
    isActive: true,
    isFeatured: false,
    isBestSeller: false,
    isOnOffer: false,
    offerText: '',
    variants: [initialVariant]
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        ...productToEdit,
        category: productToEdit.category?._id || productToEdit.category || ''
      });
      setImagePreview(productToEdit.image || '');
      setImageFile(null);
      setVariantImageFiles({});
    } else {
      setFormData({
        name: '',
        brand: '',
        category: categories.length > 0 ? categories[0]._id : '',
        description: '',
        image: '',
        isActive: true,
        isFeatured: false,
        isBestSeller: false,
        isOnOffer: false,
        offerText: '',
        variants: [{ ...initialVariant }]
      });
      setImagePreview('');
      setImageFile(null);
      setVariantImageFiles({});
    }
  }, [productToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { ...initialVariant }]
    }));
  };

  const removeVariant = (index) => {
    if (formData.variants.length === 1) return; // Must have at least one
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, variants: newVariants }));
    
    // Cleanup files
    const newFiles = { ...variantImageFiles };
    delete newFiles[index];
    // Re-index remaining files
    const reindexedFiles = {};
    Object.keys(newFiles).forEach(key => {
      const numKey = parseInt(key);
      if (numKey > index) {
        reindexedFiles[numKey - 1] = newFiles[key];
      } else {
        reindexedFiles[numKey] = newFiles[key];
      }
    });
    setVariantImageFiles(reindexedFiles);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVariantImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      setVariantImageFiles(prev => ({ ...prev, [index]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        handleVariantChange(index, 'image', reader.result); // use as preview
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveVariantImage = (index, e) => {
    e.stopPropagation(); // Prevent opening file dialog
    e.preventDefault();
    
    // Remove from files state
    setVariantImageFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[index];
      return newFiles;
    });
    
    // Clear preview/image in formData
    handleVariantChange(index, 'image', '');
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800; // Resize to max 800px
          
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.8); // 80% quality
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (file) => {
    if (!file) return '';
    
    // Compress image instantly in browser before uploading to save massive network time
    const compressedFile = await compressImage(file);
    
    const form = new FormData();
    form.append('image', compressedFile);
    
    try {
      const res = await api.post('/admin/upload?type=product', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.url;
    } catch (err) {
      console.error('Image upload failed', err);
      throw new Error('Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.variants.length === 0) {
      alert("Please add at least one variant.");
      return;
    }

    setLoading(true);
    setUploading(true);
    try {
      // Execute ALL uploads concurrently for maximum speed
      const mainImagePromise = imageFile ? uploadFile(imageFile) : Promise.resolve(formData.image);
      
      const variantPromises = Promise.all(
        formData.variants.map(async (variant, index) => {
          let vImageUrl = variant.image;
          if (variantImageFiles[index]) {
            vImageUrl = await uploadFile(variantImageFiles[index]);
          }
          return { ...variant, image: vImageUrl };
        })
      );

      const [imageUrl, uploadedVariants] = await Promise.all([mainImagePromise, variantPromises]);

      const payload = { ...formData, image: imageUrl, variants: uploadedVariants };

      let savedProduct;
      if (productToEdit) {
        const res = await api.put(`/admin/products/${productToEdit._id}`, payload);
        savedProduct = res.data.product;
      } else {
        const res = await api.post('/admin/products', payload);
        savedProduct = res.data.product;
      }

      onSuccess(savedProduct, !!productToEdit);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to save product');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content product-modal">
        <div className="modal-header">
          <h2 className="text-h2">{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            {/* Basic Details */}
            <div className="form-section">
              <h3 className="section-title">Basic Details</h3>
              
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  className="input-field" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Brand</label>
                  <input 
                    type="text" 
                    name="brand" 
                    className="input-field" 
                    value={formData.brand} 
                    onChange={handleInputChange} 
                  />
                </div>
                
                <div className="form-group flex-1">
                  <label className="form-label">Category *</label>
                  <select 
                    name="category" 
                    className="input-field" 
                    value={formData.category} 
                    onChange={handleInputChange} 
                    required
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  name="description" 
                  className="input-field" 
                  rows="3" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                ></textarea>
              </div>

              {/* Toggles */}
              <div className="toggles-grid">
                <label className="toggle-label">
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                  <span>Active</span>
                </label>
                <label className="toggle-label">
                  <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleInputChange} />
                  <span>Featured</span>
                </label>
                <label className="toggle-label">
                  <input type="checkbox" name="isBestSeller" checked={formData.isBestSeller} onChange={handleInputChange} />
                  <span>Best Seller</span>
                </label>
                <label className="toggle-label">
                  <input type="checkbox" name="isOnOffer" checked={formData.isOnOffer} onChange={handleInputChange} />
                  <span>On Offer</span>
                </label>
              </div>

              {formData.isOnOffer && (
                <div className="form-group mt-3">
                  <label className="form-label">Offer Text (e.g., "10% OFF")</label>
                  <input type="text" name="offerText" className="input-field" value={formData.offerText} onChange={handleInputChange} />
                </div>
              )}
            </div>

            {/* Image & Variants */}
            <div className="form-section">
              <h3 className="section-title">Product Image</h3>
              <div className="image-upload-container">
                {imagePreview ? (
                  <div className="image-preview-wrapper">
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                    <button type="button" className="btn-remove-image" onClick={() => { setImagePreview(''); setImageFile(null); setFormData(p => ({...p, image: ''})); }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="image-upload-label">
                    <Upload size={32} className="text-muted mb-2" />
                    <span>Click to upload image</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                  </label>
                )}
              </div>

              <div className="flex justify-between items-center mt-6" style={{ marginBottom: '1.5rem' }}>
                <h3 className="section-title m-0">Variants *</h3>
                <button type="button" className="btn-outline btn-sm" onClick={addVariant}>
                  <Plus size={16} /> Add Variant
                </button>
              </div>
              
              <div className="variants-container">
                {formData.variants.map((variant, index) => (
                  <div key={index} className="variant-card">
                    <div className="variant-header">
                      <div className="variant-header-top">
                        <div className="variant-image-wrapper">
                          <label className="variant-image-upload">
                            {variant.image ? (
                              <img src={variant.image} alt="variant" className="variant-image-preview" />
                            ) : (
                              <Upload size={20} className="text-muted" />
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleVariantImageChange(index, e)} hidden />
                          </label>
                          {variant.image && (
                            <button 
                              type="button" 
                              className="variant-image-remove"
                              onClick={(e) => handleRemoveVariantImage(index, e)}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                        <span className="font-bold text-small flex-1">Variant #{index + 1}</span>
                      </div>
                      {formData.variants.length > 1 && (
                        <button type="button" className="btn-icon text-danger" onClick={() => removeVariant(index)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label text-small">Variant Name (e.g., "1 kg")</label>
                      <input type="text" className="input-field" value={variant.name} onChange={(e) => handleVariantChange(index, 'name', e.target.value)} required />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label className="form-label text-small">Price (₹)</label>
                        <input type="number" min="0" step="0.01" className="input-field" value={variant.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} required />
                      </div>
                      <div className="form-group flex-1">
                        <label className="form-label text-small">MRP (₹)</label>
                        <input type="number" min="0" step="0.01" className="input-field" value={variant.mrp} onChange={(e) => handleVariantChange(index, 'mrp', e.target.value)} />
                      </div>
                    </div>
                    
                    <label className="toggle-label text-small">
                      <input type="checkbox" checked={variant.inStock} onChange={(e) => handleVariantChange(index, 'inStock', e.target.checked)} />
                      <span>In Stock</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose} disabled={loading || uploading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || uploading}>
              {(loading || uploading) ? <><Loader2 size={18} className="spin" /> Saving...</> : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
