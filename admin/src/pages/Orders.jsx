import { useState, useEffect } from 'react';
import api from '../api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    
    setUpdating(orderId);
    try {
      const res = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? res.data.order : o));
      }
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status) => {
    let className = 'status-badge default';
    if (status === 'DELIVERED') className = 'status-badge success';
    else if (status === 'PENDING') className = 'status-badge warning';
    else if (status === 'OUT_FOR_DELIVERY') className = 'status-badge info';
    else if (status === 'CANCELLED') className = 'status-badge danger';
    
    return <span className={className}>{status}</span>;
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-h1">Order Management</h1>
        <button className="btn-outline" onClick={fetchOrders}>Refresh</button>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>No orders found.</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order._id}>
                  <td className="font-bold" data-label="Order ID">{order.orderId}</td>
                  <td data-label="Date">{new Date(order.createdAt).toLocaleString()}</td>
                  <td data-label="Customer" style={{textAlign: 'right'}}>
                    <div>{order.customer.name}</div>
                    <div className="text-small text-muted">{order.customer.phone}</div>
                  </td>
                  <td className="font-bold" data-label="Total">₹{order.total}</td>
                  <td data-label="Payment" style={{textAlign: 'right'}}>
                    <span style={{textTransform: 'uppercase'}}>{order.paymentMethod}</span>
                    <br />
                    <span className="text-small text-muted">{order.paymentStatus}</span>
                  </td>
                  <td data-label="Status">{getStatusBadge(order.status)}</td>
                  <td data-label="Actions">
                    <select 
                      className="input-field" 
                      style={{ width: 'auto', padding: '4px' }}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      disabled={updating === order._id}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PACKING">PACKING</option>
                      <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
