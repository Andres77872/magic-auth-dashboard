import React from 'react';
import type { ChartConfig } from '@/types/analytics.types';

interface ChartProps {
  config: ChartConfig;
  className?: string;
}

export function Chart({ config, className = '' }: ChartProps): React.JSX.Element {
  const { type, data, title, color = 'var(--color-primary-500)', height = 200 } = config;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const renderLineChart = () => {
    const width = 400;
    const chartHeight = height - 40; // Leave space for labels
    const padding = 40;

    if (data.length === 0) return null;

    const stepX = (width - 2 * padding) / Math.max(data.length - 1, 1);
    const stepY = chartHeight / range;

    const pathData = data.map((point, index) => {
      const x = padding + index * stepX;
      const y = chartHeight - (point.value - minValue) * stepY + 20;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <div className="line-chart">
        <svg width={width} height={height} className="chart-svg">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-gray-200)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Data line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = padding + index * stepX;
            const y = chartHeight - (point.value - minValue) * stepY + 20;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                className="chart-point"
              />
            );
          })}
          
          {/* Labels */}
          {data.map((point, index) => {
            const x = padding + index * stepX;
            return (
              <text
                key={index}
                x={x}
                y={height - 5}
                textAnchor="middle"
                fontSize="10"
                fill="var(--color-gray-600)"
              >
                {point.label}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderBarChart = () => {
    const width = 400;
    const chartHeight = height - 40;
    const padding = 40;
    const barWidth = Math.max(20, (width - 2 * padding) / data.length - 10);

    return (
      <div className="bar-chart">
        <svg width={width} height={height} className="chart-svg">
          {data.map((point, index) => {
            const x = padding + index * (barWidth + 10);
            const barHeight = (point.value / maxValue) * chartHeight;
            const y = chartHeight - barHeight + 20;

            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  className="chart-bar"
                />
                <text
                  x={x + barWidth / 2}
                  y={height - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--color-gray-600)"
                >
                  {point.label}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--color-gray-600)"
                >
                  {point.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderPieChart = () => {
    const size = Math.min(height, 300);
    const radius = size / 2 - 20;
    const centerX = size / 2;
    const centerY = size / 2;

    const total = data.reduce((sum, point) => sum + point.value, 0);
    let currentAngle = 0;

    return (
      <div className="pie-chart">
        <svg width={size} height={size} className="chart-svg">
          {data.map((point, index) => {
            const angle = (point.value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            currentAngle += angle;

            const startRadians = (startAngle * Math.PI) / 180;
            const endRadians = (endAngle * Math.PI) / 180;

            const x1 = centerX + radius * Math.cos(startRadians);
            const y1 = centerY + radius * Math.sin(startRadians);
            const x2 = centerX + radius * Math.cos(endRadians);
            const y2 = centerY + radius * Math.sin(endRadians);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            const colors = [
              'var(--color-primary-500)',
              'var(--color-success)',
              'var(--color-warning)',
              'var(--color-error)',
              'var(--color-info)',
              'var(--color-gray-500)',
            ];

            return (
              <path
                key={index}
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="2"
                className="chart-slice"
              />
            );
          })}
        </svg>
        
        <div className="pie-legend">
          {data.map((point, index) => {
            const colors = [
              'var(--color-primary-500)',
              'var(--color-success)',
              'var(--color-warning)',
              'var(--color-error)',
              'var(--color-info)',
              'var(--color-gray-500)',
            ];
            
            return (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color legend-color-dynamic"
                  style={{ '--dynamic-legend-color': colors[index % colors.length] } as React.CSSProperties}
                />
                <span className="legend-label">{point.label}</span>
                <span className="legend-value">{point.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDoughnutChart = () => {
    const size = Math.min(height, 300);
    const outerRadius = size / 2 - 20;
    const innerRadius = outerRadius * 0.6;
    const centerX = size / 2;
    const centerY = size / 2;

    const total = data.reduce((sum, point) => sum + point.value, 0);
    let currentAngle = 0;

    return (
      <div className="doughnut-chart">
        <svg width={size} height={size} className="chart-svg">
          {data.map((point, index) => {
            const angle = (point.value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            currentAngle += angle;

            const startRadians = (startAngle * Math.PI) / 180;
            const endRadians = (endAngle * Math.PI) / 180;

            const x1 = centerX + outerRadius * Math.cos(startRadians);
            const y1 = centerY + outerRadius * Math.sin(startRadians);
            const x2 = centerX + outerRadius * Math.cos(endRadians);
            const y2 = centerY + outerRadius * Math.sin(endRadians);

            const x3 = centerX + innerRadius * Math.cos(endRadians);
            const y3 = centerY + innerRadius * Math.sin(endRadians);
            const x4 = centerX + innerRadius * Math.cos(startRadians);
            const y4 = centerY + innerRadius * Math.sin(startRadians);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = [
              `M ${x1} ${y1}`,
              `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `L ${x3} ${y3}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
              'Z'
            ].join(' ');

            const colors = [
              'var(--color-primary-500)',
              'var(--color-success)',
              'var(--color-warning)',
              'var(--color-error)',
              'var(--color-info)',
              'var(--color-gray-500)',
            ];

            return (
              <path
                key={index}
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="2"
                className="chart-slice"
              />
            );
          })}
          
          {/* Center text */}
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="16"
            fontWeight="bold"
            fill="var(--color-gray-800)"
          >
            {total}
          </text>
        </svg>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className={`chart chart-empty ${className}`}>
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <p>No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chart chart-${type} ${className}`}>
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="chart-content">
        {type === 'line' && renderLineChart()}
        {type === 'bar' && renderBarChart()}
        {type === 'pie' && renderPieChart()}
        {type === 'doughnut' && renderDoughnutChart()}
      </div>
    </div>
  );
}

export default Chart; 