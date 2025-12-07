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
    sm: { iconClass: 'h-4 w-4', fontSize: '0.75rem', gap: '4px' },
    md: { iconClass: 'h-5 w-5', fontSize: '0.875rem', gap: '4px' },
    lg: { iconClass: 'h-7 w-7', fontSize: '1rem', gap: '6px' }
  };
  
  const config = sizes[size] || sizes.md;
  
  // Clamp rating and render exactly maxStars items
  const clamped = Math.max(0, Math.min(maxStars, Math.round(rating)));
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);
  
  // Map size to Tailwind classes for consistency
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7'
  };
  
  const starSizeClass = sizeClasses[size] || sizeClasses.md;
  
  return (
    <div className={`star-rating star-rating-${size}`}>
      <div className="stars-container" style={{ gap: config.gap }}>
        {stars.map((value) => (
          <div key={value} className="star-wrapper">
            <Star
              className={`star ${config.iconClass} ${
                value <= clamped ? 'star-filled' : 'star-empty'
              }`}
            />
            {value <= clamped && <div className="star-glow" />}
          </div>
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

