import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Package, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import './Account.css';

const Account = () => {
  const navigate = useNavigate();
  const { customerDetails, setCustomerDetails, settings } = useAppContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (customerDetails) {
      setFormData({
        name: customerDetails.name || '',
        phone: customerDetails.phone || '',
        address: customerDetails.address || ''
      });
    }
  }, [customerDetails]);

  const handleSave = (e) => {
    e.preventDefault();
    setCustomerDetails(formData);
    setIsEditing(false);
  };

  return (
    <div className="account-page">
      <div className="account-header">
        <h1 className="text-h2">My Account</h1>
      </div>

      <div className="px-4 py-4">
        {/* Profile Section */}
        <div className="account-card mb-4">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h2 className="text-h3 flex items-center gap-2">
              <User size={20} className="text-primary" /> Profile Details
            </h2>
            {!isEditing && (
              <button className="text-primary font-bold text-small" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="edit-form">
              <div className="form-group mb-3">
                <label className="text-small font-bold text-muted mb-1 block">Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group mb-3">
                <label className="text-small font-bold text-muted mb-1 block">Phone</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
              <div className="form-group mb-3">
                <label className="text-small font-bold text-muted mb-1 block">Address</label>
                <textarea 
                  className="input-field" 
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-outline flex-1" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save Details</button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <div className="detail-row mb-3">
                <User size={16} className="text-muted mr-3" />
                <span>{customerDetails?.name || 'Not provided'}</span>
              </div>
              <div className="detail-row mb-3">
                <Phone size={16} className="text-muted mr-3" />
                <span>{customerDetails?.phone || 'Not provided'}</span>
              </div>
              <div className="detail-row">
                <MapPin size={16} className="text-muted mr-3" />
                <span>{customerDetails?.address || 'Not provided'}</span>
              </div>
              
              {(!customerDetails?.name || !customerDetails?.phone) && (
                <div className="mt-3 text-small text-warning bg-yellow-50 p-2 rounded">
                  Tip: Add your details here so they auto-fill at checkout!
                </div>
              )}
            </div>
          )}
        </div>



        {/* Store Info */}
        <div className="store-info-card mt-6 text-center">
          <Store size={32} className="text-muted mx-auto mb-2" />
          <h3 className="font-bold mb-1">{settings?.storeName || 'TheParchoons'}</h3>
          {settings?.storePhone && <p className="text-small text-muted mb-1">📞 {settings.storePhone}</p>}
          {settings?.storeTimings && <p className="text-small text-muted">🕒 {settings.storeTimings}</p>}
        </div>
      </div>
      
      <div style={{ height: '20px' }}></div>
    </div>
  );
};

export default Account;
