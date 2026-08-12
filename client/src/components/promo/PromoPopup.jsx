import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import './PromoPopup.css';

const PromoPopup = () => {
  const { settings } = useAppContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!settings?.popupEnabled) return;
    if (!settings?.popupTitle && !settings?.popupMessage) return;

    // Only show once per browser session
    const alreadySeen = sessionStorage.getItem('parchoons_popup_seen');
    if (alreadySeen) return;

    // Small delay so the page loads first
    const timer = setTimeout(() => {
      setVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [settings]);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem('parchoons_popup_seen', 'true');
  };

  if (!visible) return null;

  return (
    <div className="promo-popup-overlay" onClick={handleClose}>
      <div className="promo-popup-card" onClick={(e) => e.stopPropagation()}>
        <button className="promo-popup-close" onClick={handleClose}>
          <X size={18} />
        </button>

        {settings.popupImage && (
          <img
            src={settings.popupImage}
            alt="Promotion"
            className="promo-popup-image"
          />
        )}

        <div className="promo-popup-body">
          {settings.popupTitle && <h2>{settings.popupTitle}</h2>}
          {settings.popupMessage && <p>{settings.popupMessage}</p>}
          <button className="promo-popup-cta" onClick={handleClose}>
            {settings.popupButtonText || 'Shop Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoPopup;
