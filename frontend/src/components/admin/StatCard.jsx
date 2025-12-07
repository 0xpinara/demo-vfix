import React from 'react';
import './StatCard.css';

/**
 * Stat card component for displaying metrics
 * @param {string} title - Card title
 * @param {string|number} value - Main value to display
 * @param {string} subtitle - Optional subtitle
 * @param {React.Component} icon - Lucide icon component
 * @param {string} trend - 'up', 'down', or 'neutral'
 * @param {string} trendValue - Trend percentage or text
 * @param {string} color - 'primary', 'success', 'warning', 'danger'
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary'
}) {
  const colorClasses = {
    primary: 'stat-card-primary',
    success: 'stat-card-success',
    warning: 'stat-card-warning',
    danger: 'stat-card-danger'
  };

  return (
    <div className={`stat-card ${colorClasses[color]}`}>
      <div className="stat-card-header">
        <div className="stat-card-icon-wrapper">
          {Icon && <Icon className="stat-card-icon" />}
        </div>
        {trend && (
          <div className={`stat-card-trend trend-${trend}`}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'neutral' && '→'}
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>
      <div className="stat-card-body">
        <h3 className="stat-card-value">{value}</h3>
        <p className="stat-card-title">{title}</p>
        {subtitle && <span className="stat-card-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}

