import React from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

/**
 * Star rating display component
 * @param {number} rating - Rating value (0-5)
 * @param {string} size - 'sm', 'md', 'lg'
 * @param {boolean} showValue - Whether to show numeric value
 */
export default function StarRating({ 
  rating = 0, 
  size = 'md', 
  showValue = true,
  maxStars = 5
}) {
  const sizes = {
    sm: { iconSize: 14, fontSize: '0.75rem', gap: '2px' },
    md: { iconSize: 18, fontSize: '0.875rem', gap: '3px' },
    lg: { iconSize: 24, fontSize: '1rem', gap: '4px' }
  };
  
  const config = sizes[size] || sizes.md;
  
  // Calculate full, half, and empty stars
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className={`star-rating star-rating-${size}`} style={{ gap: config.gap }}>
      <div className="stars-container" style={{ gap: config.gap }}>
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            size={config.iconSize}
            className="star star-filled"
          />
        ))}
        
        {/* Half star (if applicable) */}
        {hasHalfStar && (
          <div className="star-half-wrapper" style={{ width: config.iconSize, height: config.iconSize }}>
            <Star
              size={config.iconSize}
              className="star star-empty star-half-bg"
            />
            <div className="star-half-mask" style={{ width: config.iconSize / 2 }}>
              <Star
                size={config.iconSize}
                className="star star-filled"
              />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            size={config.iconSize}
            className="star star-empty"
          />
        ))}
      </div>
      
      {showValue && (
        <span className="rating-value" style={{ fontSize: config.fontSize }}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

