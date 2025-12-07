import React from 'react';
import './HalfCircleProgress.css';

/**
 * Half-circle progress indicator component
 * @param {number} percentage - Value from 0-100
 * @param {string} label - Label text to display
 * @param {string} size - 'sm', 'md', 'lg'
 * @param {boolean} invertColors - If true, lower is better (red for high, green for low)
 */
export default function HalfCircleProgress({ 
  percentage = 0, 
  label, 
  size = 'md',
  invertColors = false,
  sublabel
}) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  
  // Calculate rotation (0% = -90deg, 100% = 90deg)
  const rotation = (clampedPercentage / 100) * 180 - 90;
  
  // Determine color based on percentage
  const getColor = () => {
    const value = invertColors ? 100 - clampedPercentage : clampedPercentage;
    if (value >= 70) return { color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' }; // Green
    if (value >= 40) return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' }; // Yellow/Amber
    return { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' }; // Red
  };
  
  const { color, glow } = getColor();
  
  // Size configurations
  const sizes = {
    sm: { width: 120, height: 70, strokeWidth: 8, fontSize: '1.25rem' },
    md: { width: 160, height: 90, strokeWidth: 10, fontSize: '1.5rem' },
    lg: { width: 200, height: 110, strokeWidth: 12, fontSize: '1.75rem' }
  };
  
  const config = sizes[size] || sizes.md;
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div className={`half-circle-progress half-circle-${size}`}>
      <svg 
        width={config.width} 
        height={config.height} 
        viewBox={`0 0 ${config.width} ${config.height + 10}`}
      >
        {/* Background arc */}
        <path
          d={`M ${config.strokeWidth / 2}, ${config.height} 
              A ${radius}, ${radius} 0 0 1 ${config.width - config.strokeWidth / 2}, ${config.height}`}
          fill="none"
          stroke="rgba(99, 102, 241, 0.15)"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Progress arc */}
        <path
          d={`M ${config.strokeWidth / 2}, ${config.height} 
              A ${radius}, ${radius} 0 0 1 ${config.width - config.strokeWidth / 2}, ${config.height}`}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease',
            filter: `drop-shadow(0 0 8px ${glow})`
          }}
        />
        
        {/* Percentage text */}
        <text
          x={config.width / 2}
          y={config.height - 10}
          textAnchor="middle"
          fill={color}
          fontSize={config.fontSize}
          fontWeight="700"
          style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
        >
          {clampedPercentage.toFixed(1)}%
        </text>
      </svg>
      
      <div className="half-circle-labels">
        <span className="half-circle-label">{label}</span>
        {sublabel && <span className="half-circle-sublabel">{sublabel}</span>}
      </div>
    </div>
  );
}

