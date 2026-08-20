import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { productCardUrl } from '../../utils/imageUrl';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { cart, addToCart, updateQuantity, removeFromCart } = useAppContext();
  
  // Default to first variant
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?._id);
  
  const selectedVariant = product.variants.find(v => v._id === selectedVariantId) || product.variants[0];
  
  // Find if this specific variant is in cart
  const cartItem = cart.find(item => item.variantId === selectedVariant._id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleVariantChange = (e) => {
    setSelectedVariantId(e.target.value);
  };

  const handleAdd = () => {
    addToCart(product, selectedVariant, 1);
  };

  const handleIncrement = () => {
    updateQuantity(selectedVariant._id, quantityInCart + 1);
  };

  const handleDecrement = () => {
    if (quantityInCart === 1) {
      removeFromCart(selectedVariant._id);
    } else {
      updateQuantity(selectedVariant._id, quantityInCart - 1);
    }
  };

  // Safe fallback for image: variant image -> product image -> placeholder
  const rawImgUrl = selectedVariant.image || product.image || 'https://via.placeholder.com/150?text=No+Image';
  const imgUrl = productCardUrl(rawImgUrl);

  return (
    <div className="product-card">
      <div className="product-image-container">
        {product.isOnOffer && <div className="badge offer-badge">{product.offerText || 'Offer'}</div>}
        {product.isBestSeller && !product.isOnOffer && <div className="badge bestseller-badge">Best Seller</div>}
        <img src={imgUrl} alt={product.name} className="product-image" loading="lazy" width="240" height="180" />
      </div>
      
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-brand">{product.brand}</p>
        
        {product.variants.length > 1 ? (
          <select 
            className="variant-select" 
            value={selectedVariantId} 
            onChange={handleVariantChange}
          >
            {product.variants.map(variant => (
              <option key={variant._id} value={variant._id}>
                {variant.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="single-variant">{selectedVariant.name}</div>
        )}
        
        <div className="price-row">
          <div className="price-container">
            <span className="price">₹{selectedVariant.price}</span>
            {selectedVariant.mrp > selectedVariant.price && (
              <span className="mrp">₹{selectedVariant.mrp}</span>
            )}
          </div>
          
          <div className="action-container">
            {!selectedVariant.inStock ? (
              <span className="out-of-stock">Out of Stock</span>
            ) : quantityInCart > 0 ? (
              <div className="quantity-control">
                <button className="qty-btn" onClick={handleDecrement}>
                  <Minus size={16} />
                </button>
                <span className="qty-count">{quantityInCart}</span>
                <button className="qty-btn" onClick={handleIncrement}>
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <button className="add-btn" onClick={handleAdd}>
                ADD
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
