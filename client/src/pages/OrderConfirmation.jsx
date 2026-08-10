import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package } from 'lucide-react';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="confirmation-page">
      <div className="confirmation-content">
        <CheckCircle size={80} className="success-icon mb-4" />
        <h1 className="text-h1 mb-2">Order Placed!</h1>
        <p className="text-muted mb-6">
          Your order has been placed successfully and is being processed.
        </p>

        <div className="order-id-box mb-6">
          <span className="text-small">Order ID</span>
          <div className="font-bold text-h2">{orderId}</div>
        </div>

        <div className="action-buttons">
          <button className="btn-primary" onClick={() => navigate('/orders')}>
            <Package size={18} />
            Track Order
          </button>
          
          <button className="btn-outline" onClick={() => navigate('/')}>
            Continue Shopping
          </button>

          <a 
            href="https://wa.me/919999999999?text=Hi, I have a query regarding my order: ${orderId}"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
