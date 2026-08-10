import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // --- Cart State ---
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('parchoons_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // --- App State ---
  const [settings, setSettings] = useState(null);
  const [location, setLocation] = useState(null); // { lat, lng }
  const [customerDetails, setCustomerDetails] = useState(() => {
    const saved = localStorage.getItem('parchoons_customer');
    return saved ? JSON.parse(saved) : { name: '', phone: '', address: '' };
  });

  useEffect(() => {
    localStorage.setItem('parchoons_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('parchoons_customer', JSON.stringify(customerDetails));
  }, [customerDetails]);

  // Fetch settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/public');
        setSettings(res.data.settings);
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    fetchSettings();
  }, []);

  // --- Cart Actions ---
  const addToCart = (product, variant, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.variantId === variant._id);
      if (existing) {
        return prev.map((item) =>
          item.variantId === variant._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          productName: product.name,
          variantId: variant._id,
          variantName: variant.name,
          price: variant.price,
          quantity,
          image: variant.image || product.image,
        },
      ];
    });
  };

  const updateQuantity = (variantId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (variantId) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartTotal,
        getCartCount,
        settings,
        location,
        setLocation,
        customerDetails,
        setCustomerDetails,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
