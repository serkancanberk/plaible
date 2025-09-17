// src/admin/components/SimpleChart.tsx
import React from 'react';

interface ChartDataPoint {
  date: string;
  credits: number;
  debits: number;
}

interface SimpleChartProps {
  data: ChartDataPoint[];
  title: string;
  height?: number;
}

export const SimpleChart: React.FC<SimpleChartProps> = ({ data, title, height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.credits || 0, d.debits || 0))
  );

  // Handle case where all values are 0 or invalid
  const safeMaxValue = maxValue > 0 ? maxValue : 1;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="relative overflow-hidden" style={{ height: `${height + 40}px` }}>
        <svg width="100%" height="100%" className="overflow-hidden">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <g key={index}>
              <line
                x1="0"
                y1={height * ratio}
                x2="100%"
                y2={height * ratio}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
              <text
                x="0"
                y={height * ratio - 5}
                fontSize="12"
                fill="#6b7280"
                textAnchor="start"
              >
                {Math.round(safeMaxValue * (1 - ratio))}
              </text>
            </g>
          ))}

          {/* Data bars */}
          {data.map((point, index) => {
            const x = data.length > 1 ? (index / (data.length - 1)) * 100 : 50;
            const creditsHeight = ((point.credits || 0) / safeMaxValue) * height;
            const debitsHeight = ((point.debits || 0) / safeMaxValue) * height;
            const barWidth = Math.max(100 / data.length - 2, 2);

            return (
              <g key={index}>
                {/* Credits bar */}
                <rect
                  x={`${x - barWidth/2}%`}
                  y={height - creditsHeight}
                  width={`${barWidth}%`}
                  height={creditsHeight}
                  fill="#10b981"
                  opacity="0.8"
                />
                {/* Debits bar */}
                <rect
                  x={`${x - barWidth/2}%`}
                  y={height - debitsHeight}
                  width={`${barWidth}%`}
                  height={debitsHeight}
                  fill="#ef4444"
                  opacity="0.8"
                />
                {/* Date label */}
                <text
                  x={`${x}%`}
                  y={height + 15}
                  fontSize="10"
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  {formatDate(point.date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-6 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Credits Added</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Credits Spent</span>
        </div>
      </div>
    </div>
  );
};
