import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Banner from '../components/banner/Banner';
import CategoryCard from '../components/category/CategoryCard';
import ProductCard from '../components/product/ProductCard';
import { Search, ChevronRight } from 'lucide-react';
import './Home.css';

const SEARCH_TERMS = ['atta', 'dal', 'mustard oil', 'milk', 'surf excel', 'bread', 'sugar', 'paneer', 'maggi', 'tea', 'biscuits', 'shampoo', 'namkeen', 'chips'];


const Home = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Typing effect state
  const [currentTermIndex, setCurrentTermIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [bannersRes, catsRes, featuredRes, bestsellerRes] = await Promise.all([
          api.get('/banners'),
          api.get('/categories'),
          api.get('/products?featured=true&limit=15'),
          api.get('/products?bestseller=true&limit=15')
        ]);
        
        setBanners(bannersRes.data.banners);
        setCategories(catsRes.data.categories);
        setFeaturedProducts(featuredRes.data.products);
        setBestSellers(bestsellerRes.data.products);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);

  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typing effect logic
  useEffect(() => {
    const term = SEARCH_TERMS[currentTermIndex];
    let typingSpeed = isDeleting ? 50 : 150; // Faster when deleting

    if (!isDeleting && currentText === term) {
      // Pause at the end of the word
      typingSpeed = 1500;
      setTimeout(() => setIsDeleting(true), typingSpeed);
      return;
    } else if (isDeleting && currentText === '') {
      // Move to the next word
      setIsDeleting(false);
      setCurrentTermIndex((prev) => (prev + 1) % SEARCH_TERMS.length);
      return;
    }

    const timeout = setTimeout(() => {
      setCurrentText(prev => 
        isDeleting 
          ? term.substring(0, prev.length - 1) 
          : term.substring(0, prev.length + 1)
      );
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentTermIndex]);

  const topCategories = categories.slice(0, 8);
  const displayBestSellers = bestSellers.slice(0, 10);
  // Only show Today's Offers if a product is explicitly on offer or has a discounted price
  const todaysOffers = [...featuredProducts, ...bestSellers].filter(p => p.isOnOffer || p.variants.some(v => v.mrp > v.price)).slice(0, 8);

  return (
    <div className="home-page">
      {/* Search Bar - redirects to a full search page */}
      <div className="search-container px-5 py-3 animate-fade-in">
        <div className="search-bar" onClick={() => navigate('/search')} style={{ cursor: 'text' }}>
          <Search size={20} className="text-muted" />
          <input 
            type="text" 
            placeholder={`Search for "${currentText}${showCursor ? '|' : ''}"`} 
            className="search-input" 
            readOnly 
            style={{ cursor: 'text' }} 
          />
        </div>
      </div>

      <div className="px-5 animate-fade-in">
        <Banner banners={banners} />
      </div>

      <section className="section mt-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="section-header px-5">
          <h2 className="text-h2">Shop by Category</h2>
          <Link to="/categories" className="view-all-link">
            More <ChevronRight size={16} />
          </Link>
        </div>
        <div className="category-grid-compact px-5">
          {topCategories.map(cat => (
            <CategoryCard key={cat._id} category={cat} />
          ))}
        </div>
      </section>

      <section className="section mt-6 pb-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="section-header px-5">
          <h2 className="text-h2">Popular Near You</h2>
        </div>
        <div className="horizontal-scroll">
          {displayBestSellers.map(product => (
            <div className="product-scroll-item" key={product._id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {todaysOffers.length > 0 && (
        <section className="section bg-light py-4 mt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="section-header px-5">
            <h2 className="text-h2">Today's Offers 🔥</h2>
          </div>
          <div className="horizontal-scroll">
            {todaysOffers.map(product => (
              <div className="product-scroll-item" key={product._id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section px-5 mt-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="section-header">
          <h2 className="text-h2">Recommended For You</h2>
        </div>
        <div className="product-grid">
          {featuredProducts.slice(0, 10).map(product => (
            <ProductCard key={`rec-${product._id}`} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
