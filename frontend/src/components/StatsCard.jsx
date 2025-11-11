import React from 'react';
import { Card } from 'primereact/card';
import './StatsCard.css';

/**
 * KPI Card Component
 * Displays a single KPI metric with icon and trend
 */
export const StatsCard = ({ label, value, icon, trend, loading = false }) => {
  if (loading) {
    return (
      <Card className="stats-card loading">
        <div className="stats-skeleton">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
        </div>
      </Card>
    );
  }

  const isPositive = trend && trend.startsWith('+');
  const trendClass = isPositive ? 'trend-positive' : 'trend-negative';

  return (
    <Card className="stats-card">
      <div className="stats-content">
        <div className="stats-icon">
          <i className={icon} style={{ fontSize: '2rem', color: '#4CAF50' }}></i>
        </div>
        <div className="stats-details">
          <h3 className="stats-value">{value}</h3>
          <p className="stats-label">{label}</p>
          {trend && <span className={`stats-trend ${trendClass}`}>{trend}</span>}
        </div>
      </div>
    </Card>
  );
};

/**
 * Error Card Component
 */
export const ErrorCard = ({ message, onRetry }) => {
  return (
    <Card className="error-card">
      <div className="error-content">
        <i className="pi pi-exclamation-triangle" style={{ fontSize: '2rem', color: '#f44336' }}></i>
        <p>{message || 'Error loading data'}</p>
        {onRetry && (
          <button onClick={onRetry} className="retry-button">
            <i className="pi pi-refresh"></i> Retry
          </button>
        )}
      </div>
    </Card>
  );
};
