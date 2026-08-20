import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import api from '../api';
import { useAppContext } from '../context/AppContext';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart, settings, customerDetails, setCustomerDetails, location, setLocation, pendingOrderId, setPendingOrderId } = useAppContext();
  
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  // Protect route — but don't redirect if we're submitting (order in flight)
  useEffect(() => {
    if (cart.length === 0 && !submitting) {
      navigate('/cart', { replace: true });
    }
  }, [cart, navigate, submitting]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({ ...prev, [name]: value }));
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLoc(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLoadingLoc(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setError('Could not get your location. Please ensure location services are enabled.');
        setLoadingLoc(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerDetails.name || !customerDetails.phone || !customerDetails.address) {
      setError('Please fill in all details.');
      return;
    }
    
    // Optional basic phone validation (10 digits)
    const phoneRegex = /^[0-9]{10,12}$/;
    if (!phoneRegex.test(customerDetails.phone.replace(/[^0-9]/g, ''))) {
      setError('Please enter a valid phone number.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // If there's a pending order (user clicked "Add More Items"), append to it
      if (pendingOrderId) {
        const addPayload = {
          cart: cart.map(item => ({
            productId: item.productId,
            productName: item.productName,
            variantId: item.variantId,
            quantity: item.quantity
          }))
        };

        const res = await api.patch(`/orders/${pendingOrderId}/add-items`, addPayload);
        
        if (res.data.success) {
          setPendingOrderId(null);
          navigate(`/order-confirmation/${pendingOrderId}?updated=1`, { replace: true });
          clearCart();
        }
      } else {
        // Normal new order flow
        const payload = {
          name: customerDetails.name,
          phone: customerDetails.phone,
          address: customerDetails.address,
          location: location || {},
          cart: cart.map(item => ({
            productId: item.productId,
            productName: item.productName,
            variantId: item.variantId,
            quantity: item.quantity
          })),
          paymentMethod: 'cod',
          idempotencyKey: idempotencyKeyRef.current,
        };

        const res = await api.post('/orders', payload);
        
        if (res.data.success) {
          navigate(`/order-confirmation/${res.data.order.orderId}`, { replace: true });
          clearCart();
        }
      }
    } catch (err) {
      console.error('Order submission failed', err);
      setError(err.response?.data?.error || 'Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  if (cart.length === 0 && !submitting) return null;

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-h2">Checkout</h1>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="px-4 py-4">
        {error && <div className="error-banner mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="form-group">
            <label>Name <span className="text-danger">*</span></label>
            <input 
              type="text" 
              name="name"
              className="input-field" 
              placeholder="Enter your name" 
              value={customerDetails.name}
              onChange={handleInputChange}
              required 
            />
          </div>

          <div className="form-group">
            <label>Phone Number <span className="text-danger">*</span></label>
            <input 
              type="tel" 
              name="phone"
              className="input-field" 
              placeholder="e.g. 9876543210" 
              value={customerDetails.phone}
              onChange={handleInputChange}
              required 
            />
          </div>

          <div className="form-group">
            <label>Delivery Address <span className="text-danger">*</span></label>
            <textarea 
              name="address"
              className="input-field" 
              rows="3" 
              placeholder="House/Flat No., Building, Street, Landmark" 
              value={customerDetails.address}
              onChange={handleInputChange}
              required 
            />
          </div>

          <div className="location-section mt-4">
            <h3 className="text-h3 mb-2">GPS Location (Optional)</h3>
            <p className="text-small mb-3">Share your live location to help our delivery partner find you easily.</p>
            
            {location ? (
              <div className="location-success">
                <MapPin size={16} /> Location captured successfully!
              </div>
            ) : (
              <button 
                type="button" 
                className="btn-outline w-full flex items-center justify-center gap-2"
                onClick={getLocation}
                disabled={loadingLoc}
              >
                {loadingLoc ? <Loader2 size={18} className="spin" /> : <MapPin size={18} />}
                {loadingLoc ? 'Getting Location...' : 'Use Current Location'}
              </button>
            )}
          </div>
          
          <div className="payment-section mt-4 pt-4 border-t">
            <h3 className="text-h3 mb-3">Payment Method</h3>
            <div className="payment-option selected">
              <input type="radio" checked readOnly />
              <div>
                <div className="font-bold">Cash on Delivery (COD)</div>
                <div className="text-small">Pay when you receive the order</div>
              </div>
            </div>
          </div>

        </form>
      </div>

      <div className="checkout-sticky-bar">
        <button 
          className="btn-primary full-width" 
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <><Loader2 size={18} className="spin" /> Processing...</>
          ) : (
            `Place Order (₹${getCartTotal() + (settings?.deliveryFee || 0)})`
          )}
        </button>
      </div>
      
      <div style={{ height: '80px' }}></div>
    </div>
  );
};

export default Checkout;
