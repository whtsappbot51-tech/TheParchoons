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
          <p className="text-muted mb-4">You will receive the details on WhatsApp.</p>
          
          <button 
            className="btn-primary" 
            onClick={() => {
              if (window.close) {
                window.close();
              }
              window.location.href = 'https://wa.me/';
            }}
          >
            Return to WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
