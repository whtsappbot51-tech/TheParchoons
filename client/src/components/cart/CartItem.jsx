import { Plus, Minus, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import './CartItem.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useAppContext();

  const handleIncrement = () => {
    updateQuantity(item.variantId, item.quantity + 1);
  };

  const handleDecrement = () => {
    updateQuantity(item.variantId, item.quantity - 1);
  };

  const handleRemove = () => {
    removeFromCart(item.variantId);
  };

  const imgUrl = item.image || 'https://via.placeholder.com/80?text=No+Image';

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        <img src={imgUrl} alt={item.productName} />
      </div>
      
      <div className="cart-item-details">
        <div className="cart-item-header">
          <h4 className="item-title">{item.productName}</h4>
          <button className="remove-btn" onClick={handleRemove}>
            <Trash2 size={16} />
          </button>
        </div>
        
        <div className="item-variant">{item.variantName}</div>
        
        <div className="cart-item-footer">
          <div className="item-price">₹{item.price * item.quantity}</div>
          
          <div className="quantity-control small">
            <button className="qty-btn" onClick={handleDecrement}>
              <Minus size={14} />
            </button>
            <span className="qty-count">{item.quantity}</span>
            <button className="qty-btn" onClick={handleIncrement}>
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
