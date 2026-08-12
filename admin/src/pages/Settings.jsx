import { useState, useEffect } from 'react';
import { Megaphone, Type, Store, Save, Check, Loader2 } from 'lucide-react';
import api from '../api';
import './Settings.css';

const MARQUEE_COLORS = [
  { name: 'green', color: '#16a34a' },
  { name: 'red', color: '#dc2626' },
  { name: 'orange', color: '#ea580c' },
  { name: 'blue', color: '#2563eb' },
  { name: 'dark', color: '#1e293b' },
  { name: 'purple', color: '#7c3aed' },
];

const Settings = () => {
  // --- Popup State ---
  const [popupEnabled, setPopupEnabled] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupImage, setPopupImage] = useState('');
  const [popupButtonText, setPopupButtonText] = useState('Shop Now');
  const [popupSaving, setPopupSaving] = useState(false);
  const [popupSaved, setPopupSaved] = useState(false);

  // --- Marquee State ---
  const [marqueeEnabled, setMarqueeEnabled] = useState(false);
  const [marqueeText, setMarqueeText] = useState('');
  const [marqueeColor, setMarqueeColor] = useState('green');
  const [marqueeSaving, setMarqueeSaving] = useState(false);
  const [marqueeSaved, setMarqueeSaved] = useState(false);

  // --- Store Info State ---
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeTimings, setStoreTimings] = useState('');
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeSaved, setStoreSaved] = useState(false);

  // --- Fetch existing settings on mount ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (res.data.success) {
          const map = {};
          res.data.settings.forEach(s => { map[s.key] = s.value; });

          setPopupEnabled(map.POPUP_ENABLED === 'true');
          setPopupTitle(map.POPUP_TITLE || '');
          setPopupMessage(map.POPUP_MESSAGE || '');
          setPopupImage(map.POPUP_IMAGE || '');
          setPopupButtonText(map.POPUP_BUTTON_TEXT || 'Shop Now');

          setMarqueeEnabled(map.MARQUEE_ENABLED === 'true');
          setMarqueeText(map.MARQUEE_TEXT || '');
          setMarqueeColor(map.MARQUEE_COLOR || 'green');

          setStoreName(map.STORE_NAME || '');
          setStorePhone(map.STORE_PHONE || '');
          setStoreAddress(map.STORE_ADDRESS || '');
          setStoreTimings(map.STORE_TIMINGS || '');
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    fetchSettings();
  }, []);

  // --- Save helpers ---
  const saveSettings = async (settingsArray, setSaving, setSaved) => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/admin/settings', { settings: settingsArray });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePopup = () => {
    saveSettings([
      { key: 'POPUP_ENABLED', value: popupEnabled ? 'true' : 'false' },
      { key: 'POPUP_TITLE', value: popupTitle },
      { key: 'POPUP_MESSAGE', value: popupMessage },
      { key: 'POPUP_IMAGE', value: popupImage },
      { key: 'POPUP_BUTTON_TEXT', value: popupButtonText },
    ], setPopupSaving, setPopupSaved);
  };

  const handleSaveMarquee = () => {
    saveSettings([
      { key: 'MARQUEE_ENABLED', value: marqueeEnabled ? 'true' : 'false' },
      { key: 'MARQUEE_TEXT', value: marqueeText },
      { key: 'MARQUEE_COLOR', value: marqueeColor },
    ], setMarqueeSaving, setMarqueeSaved);
  };

  const handleSaveStore = () => {
    saveSettings([
      { key: 'STORE_NAME', value: storeName },
      { key: 'STORE_PHONE', value: storePhone },
      { key: 'STORE_ADDRESS', value: storeAddress },
      { key: 'STORE_TIMINGS', value: storeTimings },
    ], setStoreSaving, setStoreSaved);
  };

  const SaveButton = ({ saving, saved, onClick }) => (
    <button
      className={`settings-save-btn ${saved ? 'saved' : ''}`}
      onClick={onClick}
      disabled={saving}
    >
      {saving ? (
        <><Loader2 size={16} className="spin" /> Saving...</>
      ) : saved ? (
        <><Check size={16} /> Saved!</>
      ) : (
        <><Save size={16} /> Save Changes</>
      )}
    </button>
  );

  return (
    <div className="settings-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-h1">Settings</h1>
      </div>

      {/* ─── Promotional Popup ─── */}
      <div className={`settings-section ${!popupEnabled ? 'disabled' : ''}`}>
        <div className="settings-section-header">
          <h3>
            <Megaphone size={20} className="section-icon" />
            Promotional Popup
          </h3>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={popupEnabled}
              onChange={(e) => setPopupEnabled(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="settings-body">
          <div className="settings-form-group">
            <label>Popup Title</label>
            <input
              type="text"
              placeholder="e.g. 🎉 Welcome Offer!"
              value={popupTitle}
              onChange={(e) => setPopupTitle(e.target.value)}
            />
          </div>

          <div className="settings-form-group">
            <label>Popup Message</label>
            <textarea
              placeholder="e.g. Get 20% off on your first order! Use code WELCOME20"
              value={popupMessage}
              onChange={(e) => setPopupMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="settings-form-row">
            <div className="settings-form-group">
              <label>Image URL (optional)</label>
              <input
                type="text"
                placeholder="https://... or leave blank"
                value={popupImage}
                onChange={(e) => setPopupImage(e.target.value)}
              />
              {popupImage && (
                <img src={popupImage} alt="Preview" className="popup-image-preview" />
              )}
            </div>

            <div className="settings-form-group">
              <label>Button Text</label>
              <input
                type="text"
                placeholder="e.g. Shop Now"
                value={popupButtonText}
                onChange={(e) => setPopupButtonText(e.target.value)}
              />
            </div>
          </div>

          <SaveButton saving={popupSaving} saved={popupSaved} onClick={handleSavePopup} />
        </div>
      </div>

      {/* ─── Running Marquee ─── */}
      <div className={`settings-section ${!marqueeEnabled ? 'disabled' : ''}`}>
        <div className="settings-section-header">
          <h3>
            <Type size={20} className="section-icon" />
            Running Marquee Banner
          </h3>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={marqueeEnabled}
              onChange={(e) => setMarqueeEnabled(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="settings-body">
          <div className="settings-form-group">
            <label>Marquee Text</label>
            <input
              type="text"
              placeholder="e.g. Free delivery on orders above ₹500!"
              value={marqueeText}
              onChange={(e) => setMarqueeText(e.target.value)}
            />
          </div>

          <div className="settings-form-group">
            <label>Background Color</label>
            <div className="color-presets">
              {MARQUEE_COLORS.map((c) => (
                <button
                  key={c.name}
                  className={`color-preset ${marqueeColor === c.name ? 'active' : ''}`}
                  style={{ backgroundColor: c.color }}
                  onClick={() => setMarqueeColor(c.name)}
                  title={c.name}
                  type="button"
                />
              ))}
            </div>
          </div>

          {/* Live preview */}
          {marqueeText && (
            <div
              style={{
                background: MARQUEE_COLORS.find(c => c.name === marqueeColor)?.color || '#16a34a',
                color: 'white',
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ display: 'inline-block', animation: 'marquee-scroll 10s linear infinite' }}>
                {marqueeText} &nbsp;&nbsp;&nbsp;&nbsp; {marqueeText}
              </span>
            </div>
          )}

          <SaveButton saving={marqueeSaving} saved={marqueeSaved} onClick={handleSaveMarquee} />
        </div>
      </div>

      {/* ─── Store Info ─── */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3>
            <Store size={20} className="section-icon" />
            Store Information
          </h3>
        </div>

        <div className="settings-body">
          <div className="settings-form-row">
            <div className="settings-form-group">
              <label>Store Name</label>
              <input
                type="text"
                placeholder="TheParchoons"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            <div className="settings-form-group">
              <label>Store Phone</label>
              <input
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
              />
            </div>
          </div>

          <div className="settings-form-group">
            <label>Store Address</label>
            <input
              type="text"
              placeholder="e.g. Shop No. 12, Main Market, Sector 22"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
            />
          </div>

          <div className="settings-form-group">
            <label>Store Timings</label>
            <input
              type="text"
              placeholder="e.g. 8:00 AM - 10:00 PM"
              value={storeTimings}
              onChange={(e) => setStoreTimings(e.target.value)}
            />
          </div>

          <SaveButton saving={storeSaving} saved={storeSaved} onClick={handleSaveStore} />
        </div>
      </div>
    </div>
  );
};

export default Settings;
