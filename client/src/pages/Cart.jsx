import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import CartItem from '../components/cart/CartItem';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, settings } = useAppContext();
  
  const subtotal = getCartTotal();
  const freeDeliveryAbove = settings?.freeDeliveryAbove || 0;
  const baseDeliveryFee = settings?.deliveryFee || 0;
  const minOrderAmount = settings?.minOrderAmount || 0;
  
  let deliveryFee = baseDeliveryFee;
  if (freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove) {
    deliveryFee = 0;
  }
  
  const total = subtotal + deliveryFee;
  
  const isBelowMinOrder = subtotal < minOrderAmount;

  if (cart.length === 0) {
    return (
      <div className="cart-page empty">
        <div className="cart-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-h2">Your Cart</h1>
          <div style={{ width: 24 }}></div>
        </div>
        
        <div className="empty-cart-content">
          <ShoppingBag size={64} className="text-muted mb-4" />
          <h2 className="text-h2 mb-2">Your cart is empty</h2>
          <p className="text-muted mb-4">Looks like you haven't added anything yet.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-h2">Your Cart</h1>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="cart-items-list">
        {cart.map((item) => (
          <CartItem key={`${item.productId}-${item.variantId}`} item={item} />
        ))}
      </div>

      <div className="cart-summary px-4 py-4">
        <h3 className="text-h3 mb-4">Bill Details</h3>
        
        <div className="summary-row">
          <span className="text-muted">Item Total</span>
          <span>₹{subtotal}</span>
        </div>
        
        <div className="summary-row">
          <span className="text-muted">Delivery Fee</span>
          <span>
            {deliveryFee === 0 ? (
              <span className="text-success">Free</span>
            ) : (
              `₹${deliveryFee}`
            )}
          </span>
        </div>
        
        {freeDeliveryAbove > 0 && deliveryFee > 0 && (
          <div className="delivery-hint">
            Add ₹{freeDeliveryAbove - subtotal} more for Free Delivery
          </div>
        )}
        
        <div className="summary-row total-row mt-4 pt-4 border-t">
          <span className="font-bold">To Pay</span>
          <span className="font-bold">₹{total}</span>
        </div>
      </div>

      <div className="checkout-sticky-bar">
        {isBelowMinOrder ? (
          <div className="min-order-warning">
            Minimum order amount is ₹{minOrderAmount}
          </div>
        ) : (
          <button 
            className="btn-primary full-width" 
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
        )}
      </div>
      
      <div style={{ height: '80px' }}></div>
    </div>
  );
};

export default Cart;
