import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { logout } = useAuth();
  
  return (
    <header className="mobile-header">
      <div className="mobile-header-content">
        <h2 className="mobile-brand">TheParchoons Admin</h2>
        <button className="logout-btn-header" onClick={logout} title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
