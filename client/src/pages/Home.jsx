import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Banner from '../components/banner/Banner';
import CategoryCard from '../components/category/CategoryCard';
import ProductCard from '../components/product/ProductCard';
import { Search } from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [bannersRes, catsRes, prodsRes] = await Promise.all([
          api.get('/banners'),
          api.get('/categories'),
          api.get('/products?featured=true&limit=10')
        ]);
        
        setBanners(bannersRes.data.banners);
        setCategories(catsRes.data.categories);
        setFeaturedProducts(prodsRes.data.products);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);

  if (loading) {
    return <div className="loading-state">Loading TheParchoons...</div>;
  }

  return (
    <div className="home-page">
      {/* Search Bar - redirects to a full search page */}
      <div className="search-container p-4">
        <div className="search-bar" onClick={() => navigate('/search')} style={{ cursor: 'text' }}>
          <Search size={20} className="text-muted" />
          <input type="text" placeholder="Search for atta, dal, oil..." className="search-input" readOnly style={{ cursor: 'text' }} />
        </div>
      </div>

      <div className="px-4">
        <Banner banners={banners} />
      </div>

      <section className="section px-4">
        <div className="section-header">
          <h2 className="text-h2">Shop by Category</h2>
        </div>
        <div className="category-grid">
          {categories.map(cat => (
            <CategoryCard key={cat._id} category={cat} />
          ))}
        </div>
      </section>

      <section className="section bg-light py-4 px-4 mt-4">
        <div className="section-header">
          <h2 className="text-h2">Featured Products</h2>
        </div>
        <div className="product-grid">
          {featuredProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
      
      {/* Spacer for bottom nav */}
      <div style={{ height: '20px' }}></div>
    </div>
  );
};

export default Home;
