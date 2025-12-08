import React from 'react';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';
import type { ChartConfig } from '@/types/analytics.types';

interface ChartProps {
  config: ChartConfig;
  className?: string;
}

// Modern color palette for charts
const CHART_COLORS = [
  'rgb(59, 130, 246)',   // primary blue
  'rgb(34, 197, 94)',    // green
  'rgb(245, 158, 11)',   // amber
  'rgb(239, 68, 68)',    // red
  'rgb(6, 182, 212)',    // cyan
  'rgb(168, 162, 158)',  // gray
  'rgb(139, 92, 246)',   // purple
  'rgb(236, 72, 153)',   // pink
];

export function Chart({ config, className = '' }: ChartProps): React.JSX.Element {
  const { type, data, title, color = 'rgb(59, 130, 246)', height = 200 } = config;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const renderLineChart = () => {
    const width = 400;
    const chartHeight = height - 40;
    const padding = 40;

    if (data.length === 0) return null;

    const stepX = (width - 2 * padding) / Math.max(data.length - 1, 1);
    const stepY = chartHeight / range;

    const pathData = data.map((point, index) => {
      const x = padding + index * stepX;
      const y = chartHeight - (point.value - minValue) * stepY + 20;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Create gradient area
    const areaPath = `${pathData} L ${padding + (data.length - 1) * stepX} ${chartHeight + 20} L ${padding} ${chartHeight + 20} Z`;

    return (
      <div className="w-full overflow-hidden">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="block">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = 20 + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding}
                  x2={width - padding}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px]"
                >
                  {Math.round(minValue + range * ratio)}
                </text>
              </g>
            );
          })}

          {/* Area gradient */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Data line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, index) => {
            const x = padding + index * stepX;
            const y = chartHeight - (point.value - minValue) * stepY + 20;
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="white"
                  stroke={color}
                  strokeWidth="2"
                  className="hover:r-6 transition-all cursor-pointer"
                />
                {/* Tooltip on hover */}
                <title>{`${point.label}: ${point.value}`}</title>
              </g>
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
                className="fill-muted-foreground text-[10px]"
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
    const gap = 10;

    return (
      <div className="w-full overflow-hidden">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="block">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = 20 + chartHeight * (1 - ratio);
            return (
              <line
                key={ratio}
                x1={padding}
                x2={width - padding}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeDasharray="4 4"
              />
            );
          })}

          {data.map((point, index) => {
            const x = padding + index * (barWidth + gap);
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
                  rx="4"
                  ry="4"
                  className="transition-opacity hover:opacity-80 cursor-pointer"
                />
                <text
                  x={x + barWidth / 2}
                  y={height - 5}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {point.label}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-medium"
                >
                  {point.value}
                </text>
                <title>{`${point.label}: ${point.value}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderPieChart = () => {
    const size = Math.min(height, 300);
    const radius = size / 2 - 30;
    const centerX = size / 2;
    const centerY = size / 2;

    const total = data.reduce((sum, point) => sum + point.value, 0);
    let currentAngle = -90; // Start from top

    return (
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <svg width={size} height={size} className="shrink-0">
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

            return (
              <path
                key={index}
                d={pathData}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                stroke="white"
                strokeWidth="2"
                className="transition-opacity hover:opacity-80 cursor-pointer"
              >
                <title>{`${point.label}: ${point.value} (${((point.value / total) * 100).toFixed(1)}%)`}</title>
              </path>
            );
          })}
        </svg>

        <div className="flex flex-wrap gap-3">
          {data.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="text-sm text-muted-foreground">{point.label}</span>
              <span className="text-sm font-medium text-foreground">{point.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDoughnutChart = () => {
    const size = Math.min(height, 300);
    const outerRadius = size / 2 - 30;
    const innerRadius = outerRadius * 0.6;
    const centerX = size / 2;
    const centerY = size / 2;

    const total = data.reduce((sum, point) => sum + point.value, 0);
    let currentAngle = -90; // Start from top

    return (
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <svg width={size} height={size} className="shrink-0">
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

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  stroke="white"
                  strokeWidth="2"
                  className="transition-opacity hover:opacity-80 cursor-pointer"
                >
                  <title>{`${point.label}: ${point.value} (${((point.value / total) * 100).toFixed(1)}%)`}</title>
                </path>
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{total}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {data.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="text-sm text-muted-foreground">{point.label}</span>
              <span className="text-sm font-medium text-foreground">{point.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-border bg-muted/30',
        className
      )}>
        <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No data to display</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      )}
      <div className="min-h-[200px]">
        {type === 'line' && renderLineChart()}
        {type === 'bar' && renderBarChart()}
        {type === 'pie' && renderPieChart()}
        {type === 'doughnut' && renderDoughnutChart()}
      </div>
    </div>
  );
}

export default Chart;
