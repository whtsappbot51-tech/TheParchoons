import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../api';
import ProductForm from '../components/ProductForm';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const fetchProductsAndCategories = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/categories')
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const handleAddProduct = () => {
    setProductToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product) => {
    setProductToEdit(product);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (savedProduct, isEdit) => {
    setIsFormOpen(false);
    if (isEdit) {
      setProducts(prev => prev.map(p => p._id === savedProduct._id ? savedProduct : p));
    } else {
      setProducts(prev => [savedProduct, ...prev]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-h1">Products</h1>
        <button className="btn-primary" onClick={handleAddProduct}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center'}}>No products found.</td></tr>
            ) : (
              products.map(product => (
                <tr key={product._id}>
                  <td data-label="Image">
                    {product.image ? (
                      <img src={product.image} alt={product.name} style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}} />
                    ) : (
                      <div style={{width: '40px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '4px'}} />
                    )}
                  </td>
                  <td data-label="Name" style={{textAlign: 'right'}}>
                    <div>
                      <div className="font-bold">{product.name}</div>
                      <div className="text-small text-muted">{product.brand}</div>
                    </div>
                  </td>
                  <td data-label="Category">{product.category?.name || 'Uncategorized'}</td>
                  <td data-label="Status">
                    <span className={`status-badge ${product.isActive ? 'success' : 'danger'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="flex gap-2">
                      <button className="btn-outline" onClick={() => handleEditProduct(product)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-outline" style={{color: 'var(--danger)'}} onClick={() => handleDelete(product._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
