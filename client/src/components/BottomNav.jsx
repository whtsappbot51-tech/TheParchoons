import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingCart, Clock, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './BottomNav.css';

const BottomNav = () => {
  const location = useLocation();
  const { getCartCount } = useAppContext();
  const cartCount = getCartCount();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/categories', label: 'Categories', icon: Grid },
    { path: '/cart', label: 'Cart', icon: ShoppingCart, count: cartCount },
    { path: '/account', label: 'Account', icon: User },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        // Simple active check
        const isActive = location.pathname === item.path || 
                        (item.path !== '/' && location.pathname.startsWith(item.path));

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="icon-container">
              <Icon size={24} />
              {item.count > 0 && <span className="nav-badge">{item.count}</span>}
            </div>
            <span className="nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
