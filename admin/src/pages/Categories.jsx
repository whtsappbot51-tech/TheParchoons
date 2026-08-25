import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Search } from 'lucide-react';
import api from '../api';
import CategoryForm from '../components/CategoryForm';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data.categories);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setCategoryToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditCategory = (category) => {
    setCategoryToEdit(category);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (savedCategory, isEdit) => {
    setIsFormOpen(false);
    if (isEdit) {
      setCategories(prev => prev.map(c => c._id === savedCategory._id ? savedCategory : c).sort((a, b) => a.sortOrder - b.sortOrder));
    } else {
      setCategories(prev => [...prev, savedCategory].sort((a, b) => a.sortOrder - b.sortOrder));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.delete(`/admin/categories/${id}`);
        setCategories(prev => prev.filter(c => c._id !== id));
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete category');
      }
    }
  };

  // Client-side search filter (categories are small list)
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full" style={{ minHeight: '50vh' }}>
        <Loader2 size={40} className="spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-h1">Categories <span className="text-muted text-small">({categories.length})</span></h1>
        <button className="btn-primary" onClick={handleAddCategory}>
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1rem', position: 'relative', maxWidth: '400px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input-field"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '36px' }}
        />
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
              <tr>
                <th>Emoji</th>
                <th>Name</th>
                <th>Sort Order</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category._id}>
                  <td data-label="Emoji" style={{ fontSize: '1.5rem' }}>{category.emoji}</td>
                  <td data-label="Name" className="font-bold">{category.name}</td>
                  <td data-label="Sort Order">{category.sortOrder}</td>
                  <td data-label="Actions">
                    <div className="flex justify-end gap-2">
                      <button className="btn-icon text-primary" onClick={() => handleEditCategory(category)}>
                        <Edit2 size={18} />
                      </button>
                      <button className="btn-icon text-danger" onClick={() => handleDelete(category._id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                    {searchQuery ? `No categories matching "${searchQuery}"` : 'No categories found. Click "Add Category" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      <CategoryForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        categoryToEdit={categoryToEdit}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default Categories;
