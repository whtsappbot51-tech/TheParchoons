import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api';
import CategoryCard from '../components/category/CategoryCard';
import './Category.css'; // Reuse category css for layout

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="category-page">
      <div className="category-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-h2">All Categories</h1>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="px-4 py-4">
        {categories.length === 0 && !loading ? (
          <div className="empty-state">No categories found.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {categories.map(cat => (
              <CategoryCard key={cat._id} category={cat} />
            ))}
          </div>
        )}
      </div>
      <div style={{ height: '20px' }}></div>
    </div>
  );
};

export default Categories;
