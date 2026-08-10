import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('parchoons_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('parchoons_admin_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.admin);
          localStorage.setItem('parchoons_admin_user', JSON.stringify(res.data.admin));
        } catch (err) {
          // Error handled by interceptor (logout)
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = (token, adminData) => {
    localStorage.setItem('parchoons_admin_token', token);
    localStorage.setItem('parchoons_admin_user', JSON.stringify(adminData));
    setUser(adminData);
  };

  const logout = () => {
    localStorage.removeItem('parchoons_admin_token');
    localStorage.removeItem('parchoons_admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
