import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, ArrowLeft } from 'lucide-react';
import api from '../api';
import ProductCard from '../components/product/ProductCard';
import './Search.css';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get(`/products?search=${encodeURIComponent(searchQuery)}`);
      if (res.data.success) {
        setResults(res.data.products);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
    performSearch(query);
  };

  // Debounced search for live typing (optional, using explicit submit for now for simplicity, but let's add basic live typing)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 2) {
        setSearchParams({ q: query }, { replace: true });
        performSearch(query);
      } else if (query.trim() === '') {
        setResults([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="search-page">
      <div className="search-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <form className="search-input-wrapper" onSubmit={handleSearchSubmit}>
          <SearchIcon size={20} className="text-muted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
        </form>
      </div>

      <div className="search-results px-4 py-4">
        {loading ? (
          <div className="search-message">Searching...</div>
        ) : hasSearched && results.length === 0 ? (
          <div className="search-message empty">
            <p>No products found for "{query}"</p>
            <p className="text-small text-muted mt-2">Try checking the spelling or use more general terms.</p>
          </div>
        ) : results.length > 0 ? (
          <div className="product-grid">
            {results.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="search-suggestions">
            <h3 className="text-h3 mb-3 text-muted">Popular Searches</h3>
            <div className="suggestion-chips">
              {['Atta', 'Rice', 'Dal', 'Oil', 'Milk', 'Bread'].map(term => (
                <button 
                  key={term} 
                  className="chip"
                  onClick={() => {
                    setQuery(term);
                    setSearchParams({ q: term });
                    performSearch(term);
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
