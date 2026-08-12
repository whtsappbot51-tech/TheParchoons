import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// We'll create these components and pages next
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Category from './pages/Category';
import Categories from './pages/Categories';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import Account from './pages/Account';
import Search from './pages/Search';
import PromoPopup from './components/promo/PromoPopup';
import MarqueeBanner from './components/promo/MarqueeBanner';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-container">
          <Header />
          <MarqueeBanner />
          <PromoPopup />
          <main className="page-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/category/:id" element={<Category />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/account" element={<Account />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
