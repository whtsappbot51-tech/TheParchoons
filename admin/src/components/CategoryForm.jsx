import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../api';

const CategoryForm = ({ isOpen, onClose, categoryToEdit, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    emoji: '',
    sortOrder: 1,
  });

  useEffect(() => {
    if (categoryToEdit) {
      setFormData({
        name: categoryToEdit.name || '',
        emoji: categoryToEdit.emoji || '',
        sortOrder: categoryToEdit.sortOrder || 1,
      });
    } else {
      setFormData({
        name: '',
        emoji: '',
        sortOrder: 1,
      });
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let savedCategory;
      if (categoryToEdit) {
        const res = await api.put(`/admin/categories/${categoryToEdit._id}`, formData);
        savedCategory = res.data.category;
      } else {
        const res = await api.post('/admin/categories', formData);
        savedCategory = res.data.category;
      }
      
      onSuccess(savedCategory, !!categoryToEdit);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content product-modal" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2 className="text-h2">{categoryToEdit ? 'Edit Category' : 'Add New Category'}</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            <div className="form-group">
            <label className="form-label">Category Name *</label>
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
              <label className="form-label">Emoji</label>
              <input 
                type="text" 
                name="emoji" 
                className="input-field" 
                value={formData.emoji} 
                onChange={handleInputChange} 
                placeholder="e.g. 🍎"
              />
            </div>
            
            <div className="form-group flex-1">
              <label className="form-label">Sort Order</label>
              <input 
                type="number" 
                name="sortOrder" 
                className="input-field" 
                value={formData.sortOrder} 
                onChange={handleInputChange} 
                min="0"
                required
              />
            </div>
          </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><Loader2 size={18} className="spin" /> Saving...</> : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
