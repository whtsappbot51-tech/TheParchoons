import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api from '../api';
import ProductForm from '../components/ProductForm';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  // Search, filter, pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const LIMIT = 30;

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories once
  useEffect(() => {
    api.get('/admin/categories').then(res => {
      if (res.data.success) setCategories(res.data.categories);
    }).catch(console.error);
  }, []);

  // Fetch products (debounced search, category, page)
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', LIMIT);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedCategory) params.set('category', selectedCategory);

      const res = await api.get(`/admin/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.products);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = () => {
    setProductToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product) => {
    setProductToEdit(product);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (optimisticProduct, isEdit, uploadPromise) => {
    setIsFormOpen(false); // Instantly close the modal!

    // 1. Immediately update the UI with the optimistic product
    if (isEdit) {
      setProducts(prev => prev.map(p => p._id === optimisticProduct._id ? optimisticProduct : p));
    } else {
      // Add to top of list
      setProducts(prev => [optimisticProduct, ...prev]);
    }

    // 2. Wait for the real background upload to finish
    if (uploadPromise) {
      uploadPromise.then((savedProduct) => {
        // Replace the temporary product with the real one from the database
        setProducts(prev => {
          if (isEdit) {
            return prev.map(p => p._id === savedProduct._id ? savedProduct : p);
          } else {
            return prev.map(p => p._id === optimisticProduct._id ? savedProduct : p);
          }
        });
      }).catch(err => {
        alert("Failed to save product in background: " + err.message);
        fetchProducts(); // Refresh the list to fix the broken state
      });
    } else {
      fetchProducts();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const handleCategoryFilter = (e) => {
    setSelectedCategory(e.target.value);
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 className="text-h1">Products <span className="text-muted text-small">({pagination.total})</span></h1>
        <button className="btn-primary" onClick={handleAddProduct}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Search + Filter Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <select
          className="input-field"
          value={selectedCategory}
          onChange={handleCategoryFilter}
          style={{ flex: '0 0 200px', maxWidth: '200px' }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Variant</th>
              <th>Price</th>
              <th>MRP</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}><Loader2 size={24} className="spin" style={{ display: 'inline-block' }} /></td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td></tr>
            ) : (
              products.map(product => (
                <tr key={product._id}>
                  <td data-label="Image">
                    {product.image ? (
                      <img src={product.image} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#94a3b8' }}>No img</div>
                    )}
                  </td>
                  <td data-label="Name">
                    <div>
                      <div className="font-bold" style={{ fontSize: '0.85rem' }}>{product.name}</div>
                      {product.brand && <div className="text-small text-muted">{product.brand}</div>}
                    </div>
                  </td>
                  <td data-label="Category">
                    <span className="status-badge default">{product.category?.name || 'N/A'}</span>
                  </td>
                  <td data-label="Variant">
                    <span style={{ fontSize: '0.8rem' }}>{product.variants?.[0]?.name || '-'}</span>
                    {product.variants?.length > 1 && (
                      <span className="text-muted text-small" style={{ marginLeft: '4px' }}>+{product.variants.length - 1}</span>
                    )}
                  </td>
                  <td data-label="Price">
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>₹{product.variants?.[0]?.price || 0}</span>
                  </td>
                  <td data-label="MRP">
                    <span className="text-muted">₹{product.variants?.[0]?.mrp || 0}</span>
                  </td>
                  <td data-label="Stock">
                    <span className={`status-badge ${product.variants?.[0]?.inStock ? 'success' : 'danger'}`}>
                      {product.variants?.[0]?.inStock ? 'In Stock' : 'Out'}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="flex gap-2">
                      <button className="btn-outline" onClick={() => handleEditProduct(product)} title="Edit">
                        <Edit2 size={15} />
                      </button>
                      <button className="btn-outline" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(product._id)} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="text-small text-muted">
            Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, pagination.total)} of {pagination.total}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn-outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '6px 10px' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-small" style={{ fontWeight: 600, minWidth: '80px', textAlign: 'center' }}>
              Page {page} / {pagination.pages}
            </span>
            <button
              className="btn-outline"
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              style={{ padding: '6px 10px' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <ProductForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        productToEdit={productToEdit} 
        categories={categories} 
        onSuccess={handleFormSuccess} 
      />
    </div>
  );
};

export default Products;
