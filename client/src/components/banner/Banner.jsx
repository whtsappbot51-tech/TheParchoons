import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bannerUrl } from '../../utils/imageUrl';
import './Banner.css';

const Banner = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000); // 4 second auto-slide

    return () => clearInterval(interval);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="banner-container">
      <div 
        className="banner-track" 
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner, idx) => (
          <div key={banner._id} className="banner-slide">
            <Link to={banner.ctaLink || '/'}>
              <img 
                src={bannerUrl(banner.image)} 
                alt={banner.title} 
                className="banner-image" 
                loading={idx === 0 ? "eager" : "lazy"} 
                width="480"
              />
              {/* Optional overlay text if needed, usually text is baked into the image for grocery apps */}
            </Link>
          </div>
        ))}
      </div>
      
      {banners.length > 1 && (
        <div className="banner-indicators">
          {banners.map((_, idx) => (
            <div 
              key={idx} 
              className={`indicator ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Banner;
