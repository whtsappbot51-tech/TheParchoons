import { useState, useEffect } from 'react';
import { Clock, Store } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './StoreClosedOverlay.css';

const StoreClosedOverlay = () => {
  const { settings } = useAppContext();
  const [isClosed, setIsClosed] = useState(false);
  const [openTimeFormatted, setOpenTimeFormatted] = useState('');

  useEffect(() => {
    if (!settings) return;

    if (!settings.storeHoursEnabled) {
      setIsClosed(false);
      return;
    }

    const checkStoreHours = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      
      const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
      
      const openTime = settings.storeOpenTime || '08:00';
      const closeTime = settings.storeCloseTime || '22:00';

      // Format open time for display (e.g. 08:00 -> 8:00 AM)
      const [openH, openM] = openTime.split(':');
      const openDate = new Date();
      openDate.setHours(parseInt(openH), parseInt(openM));
      setOpenTimeFormatted(openDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));

      // Check logic
      let closed = false;
      if (openTime < closeTime) {
        // Normal case, e.g. 08:00 to 22:00
        if (currentTimeStr < openTime || currentTimeStr >= closeTime) {
          closed = true;
        }
      } else {
        // Overnight case, e.g. 22:00 to 08:00
        if (currentTimeStr >= closeTime && currentTimeStr < openTime) {
          closed = true;
        }
      }
      
      setIsClosed(closed);
    };

    checkStoreHours();
    
    // Re-check every minute
    const interval = setInterval(checkStoreHours, 60000);
    return () => clearInterval(interval);
  }, [settings]);

  if (!isClosed) return null;

  return (
    <div className="store-closed-overlay">
      <div className="store-closed-card">
        <div className="closed-icon-wrapper">
          <Store size={48} className="closed-icon" />
          <div className="closed-badge">
            <Clock size={16} />
          </div>
        </div>
        
        <h2>Store is Closed</h2>
        <p className="closed-message">
          We are currently closed. We will be back tomorrow at <strong>{openTimeFormatted}</strong> to serve you!
        </p>
        
        <div className="closed-divider"></div>
        
        <p className="closed-subtext">
          Thank you for choosing <strong>{settings?.storeName || 'TheParchoons'}</strong>.
        </p>
      </div>
    </div>
  );
};

export default StoreClosedOverlay;
