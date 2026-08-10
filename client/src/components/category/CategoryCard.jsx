import { Link } from 'react-router-dom';
import './CategoryCard.css';

const CategoryCard = ({ category }) => {
  return (
    <Link to={`/category/${category._id}`} className="category-card">
      <div className="category-image-wrapper">
        {category.image ? (
          <img src={category.image} alt={category.name} className="category-image" loading="lazy" />
        ) : (
          <div className="category-emoji-fallback">{category.emoji || '🛒'}</div>
        )}
      </div>
      <h3 className="category-name">{category.name}</h3>
    </Link>
  );
};

export default CategoryCard;
