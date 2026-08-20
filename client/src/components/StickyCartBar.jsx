import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './StickyCartBar.css';

const StickyCartBar = () => {
  const { cart, getCartTotal, getCartCount } = useAppContext();
  const location = useLocation();

  const count = getCartCount();
  const total = getCartTotal();

  // Hide on checkout, cart, or confirmation pages
  const hideOnPaths = ['/cart', '/checkout', '/order-confirmation'];
  const shouldHide = hideOnPaths.some(path => location.pathname.startsWith(path));

  if (count === 0 || shouldHide) {
    return null;
  }

  return (
    <div className="sticky-cart-bar-wrapper">
      <Link to="/cart" className="sticky-cart-bar animate-slide-up">
        <div className="cart-bar-info">
          <div className="cart-bar-icon-wrap">
            <ShoppingBag size={20} className="cart-bar-icon" />
            <span className="cart-bar-count">{count}</span>
          </div>
          <div className="cart-bar-price">
            <span className="item-text">{count} {count === 1 ? 'item' : 'items'}</span>
            <span className="price-val">₹{total}</span>
          </div>
        </div>
        <div className="cart-bar-action">
          <span>View Cart</span>
          <ChevronRight size={18} />
        </div>
      </Link>
    </div>
  );
};

export default StickyCartBar;
