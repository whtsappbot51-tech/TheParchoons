import { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import './MarqueeBanner.css';

const COLOR_MAP = {
  green: '#16a34a',
  red: '#dc2626',
  orange: '#ea580c',
  blue: '#2563eb',
  dark: '#1e293b',
  purple: '#7c3aed',
};

const MARQUEE_HEIGHT = 28; // approx height in px

const MarqueeBanner = () => {
  const { settings } = useAppContext();

  const isActive = settings?.marqueeEnabled && settings?.marqueeText;

  // Dynamically push page content down when marquee is visible
  useEffect(() => {
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) return;

    if (isActive) {
      pageContent.style.paddingTop = `${60 + MARQUEE_HEIGHT}px`;
    } else {
      pageContent.style.paddingTop = '60px';
    }

    return () => {
      if (pageContent) pageContent.style.paddingTop = '60px';
    };
  }, [isActive]);

  if (!isActive) return null;

  const bgColor = COLOR_MAP[settings.marqueeColor] || COLOR_MAP.green;

  return (
    <div className="marquee-banner" style={{ background: bgColor }}>
      <div className="marquee-banner-inner">
        <span>{settings.marqueeText}</span>
        <span>{settings.marqueeText}</span>
        <span>{settings.marqueeText}</span>
        <span>{settings.marqueeText}</span>
      </div>
    </div>
  );
};

export default MarqueeBanner;
