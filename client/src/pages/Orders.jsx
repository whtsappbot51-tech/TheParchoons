import { useState } from 'react';
import { ArrowLeft, Search, Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId || !phone) {
      setError('Please enter both Order ID and Phone Number.');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await api.get(`/orders/${orderId}?phone=${phone}`);
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setError(err.response?.data?.error || 'Order not found or details mismatch.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'PENDING': return <Clock className="text-warning" size={24} />;
      case 'CONFIRMED': return <CheckCircle className="text-primary" size={24} />;
      case 'PACKING': return <Package className="text-secondary" size={24} />;
      case 'OUT_FOR_DELIVERY': return <Truck className="text-primary" size={24} />;
      case 'DELIVERED': return <CheckCircle className="text-success" size={24} />;
      case 'CANCELLED': return <XCircle className="text-danger" size={24} />;
      default: return <Package size={24} />;
    }
  };

  const getStatusText = (status) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="orders-page">
      <div className="orders-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-h2">Track Order</h1>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="px-4 py-4">
        <form onSubmit={handleTrack} className="track-form mb-6">
          <div className="form-group">
            <label>Order ID</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. TP-20260810-0001" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input 
              type="tel" 
              className="input-field" 
              placeholder="Enter phone used for order" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </form>

        {error && <div className="error-banner">{error}</div>}

        {order && (
          <div className="order-details-card">
            <div className="order-details-header border-b pb-3 mb-3">
              <div>
                <span className="text-muted text-small">Order ID</span>
                <div className="font-bold">{order.orderId}</div>
              </div>
              <div className="text-right">
                <span className="text-muted text-small">Date</span>
                <div className="font-bold">
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="status-banner mb-4">
              {getStatusIcon(order.status)}
              <div className="status-text-container">
                <div className="font-bold">{getStatusText(order.status)}</div>
                <div className="text-small text-muted">
                  {order.status === 'DELIVERED' 
                    ? 'Your order has been delivered.' 
                    : 'We are processing your order.'}
                </div>
              </div>
            </div>

            <h3 className="text-h3 mb-2">Items</h3>
            <div className="order-items-list mb-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="order-item-row">
                  <div className="flex flex-col">
                    <span className="font-bold">{item.productName}</span>
                    <span className="text-small text-muted">{item.variantName} x {item.quantity}</span>
                  </div>
                  <span className="font-bold">₹{item.lineTotal}</span>
                </div>
              ))}
            </div>

            <div className="order-totals border-t pt-3">
              <div className="flex justify-between text-small mb-1">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-small mb-1">
                <span>Delivery Fee</span>
                <span>₹{order.deliveryFee}</span>
              </div>
              <div className="flex justify-between font-bold mt-2 pt-2 border-t text-h3">
                <span>Total</span>
                <span>₹{order.total}</span>
              </div>
            </div>

          </div>
        )}
      </div>
      
      <div style={{ height: '20px' }}></div>
    </div>
  );
};

export default Orders;
