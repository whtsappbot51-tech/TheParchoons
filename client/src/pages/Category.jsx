import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api';
import ProductCard from '../components/product/ProductCard';
import './Category.css';

const Category = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products?category=${id}&limit=100`);
        setProducts(res.data.products);
        
        if (res.data.products.length > 0) {
          setCategoryName(res.data.products[0].category.name);
        } else {
          // Fallback if empty category
          setCategoryName('Category Products');
        }
      } catch (err) {
        console.error('Error fetching category products:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategoryProducts();
  }, [id]);

  return (
    <div className="category-page">
      <div className="category-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-h2">{categoryName}</h1>
        <div style={{ width: 24 }}></div> {/* Spacer for flex balance */}
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p>No products found in this category.</p>
        </div>
      ) : (
        <div className="product-list px-4 py-4">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
      
      <div style={{ height: '20px' }}></div>
    </div>
  );
};

export default Category;
