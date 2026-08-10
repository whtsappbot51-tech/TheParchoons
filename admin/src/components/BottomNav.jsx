import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, ShoppingBag, Settings, Layers } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/products', label: 'Products', icon: ShoppingBag },
    { path: '/categories', label: 'Categories', icon: Layers },
  ];

  return (
    <>
      <div className="bottom-nav-spacer"></div>
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={24} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default BottomNav;
