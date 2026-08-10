import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Header.css'; // We'll create minimal specific CSS files for components if needed

const Header = () => {
  const { getCartCount, settings } = useAppContext();
  const cartCount = getCartCount();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="brand-name">
          {settings?.storeName || 'TheParchoons'}
        </Link>
      </div>
      
      <div className="header-right">
        {/* Search click navigates to search view */}
        <button className="icon-btn" onClick={() => navigate('/search')}>
          <Search size={24} />
        </button>
        
        <Link to="/cart" className="cart-icon-wrapper">
          <ShoppingCart size={24} />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
      </div>
    </header>
  );
};

export default Header;
