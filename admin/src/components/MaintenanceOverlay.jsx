import { useState, useEffect, useCallback } from 'react';
import { ServerCrash, RefreshCw } from 'lucide-react';
import api from '../api';
import './MaintenanceOverlay.css';

const MaintenanceOverlay = () => {
  const [isDown, setIsDown] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsChecking(true);
    }
    try {
      // Just hit a lightweight endpoint like /admin/stats or /settings/public
      // Using /settings/public because it doesn't require auth and is fast
      await api.get('/settings/public', { timeout: 5000 });
      // If we succeed, the server is back up
      if (isDown) setIsDown(false);
    } catch (err) {
      // If we get network error, timeout, or 5xx, it's down
      if (!err.response || err.response.status >= 500) {
        setIsDown(true);
      } else {
        // A 404 or 401 means the server is actually responding
        setIsDown(false);
      }
    } finally {
      if (isManual) {
        // slight delay so the user sees the button spin
        setTimeout(() => setIsChecking(false), 500);
      }
    }
  }, [isDown]);

  useEffect(() => {
    // Add interceptor to catch failed requests globally
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (!error.response || error.response.status >= 500) {
          setIsDown(true);
        }
        return Promise.reject(error);
      }
    );

    // Initial check
    checkHealth();

    // Check periodically if it's down
    const interval = setInterval(() => {
      if (isDown) {
        checkHealth();
      }
    }, 15000); // Check every 15s if down

    return () => {
      api.interceptors.response.eject(interceptor);
      clearInterval(interval);
    };
  }, [isDown, checkHealth]);

  if (!isDown) return null;

  return (
    <div className="maintenance-overlay">
      <div className="maintenance-card">
        <div className="maintenance-icon-wrapper">
          <div className="maintenance-pulse"></div>
          <ServerCrash size={40} />
        </div>
        
        <h2>Under Maintenance</h2>
        <p className="maintenance-msg">
          Our servers are currently undergoing maintenance or experiencing a temporary hiccup. We are working hard to bring it back online.
        </p>
        
        <button 
          className={`maintenance-retry-btn ${isChecking ? 'checking' : ''}`}
          onClick={() => checkHealth(true)}
        >
          <RefreshCw size={18} className={isChecking ? 'spin' : ''} />
          {isChecking ? 'Checking...' : 'Try Again'}
        </button>

        <div className="maintenance-footer">
          Please check back in a few minutes.
        </div>
      </div>
    </div>
  );
};

export default MaintenanceOverlay;
