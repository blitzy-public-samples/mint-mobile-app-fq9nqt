/**
 * LineChart component for visualizing time-series data
 * Addresses requirements:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 * - Budget Monitoring (Technical Specification/1.2 Scope/Core Features)
 * - Analytics and Reporting (Technical Specification/1.1 System Overview)
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useRef, useEffect } from 'react';
// @version: chart.js ^4.0.0
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
// @version: react-chartjs-2 ^5.0.0
import { Line } from 'react-chartjs-2';

// Internal imports
import { formatChartData, generateChartOptions } from '../../utils/chart.utils';
import { defaultOptions as chartConfig } from '../../config/chart.config';
import type { ChartProps } from '../../types/components.types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Human Tasks:
// 1. Verify Chart.js and react-chartjs-2 versions in package.json
// 2. Test responsive behavior across different screen sizes
// 3. Validate theme integration with application's theme system
// 4. Ensure accessibility features are properly configured
// 5. Test touch interactions on mobile devices

interface LineChartProps extends Omit<ChartProps, 'type'> {
  data: Array<{ x: string | number; y: number }>;
  options?: ChartProps['options'];
  height?: string | number;
  className?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  options = {},
  height = 300,
  className = ''
}) => {
  const chartRef = useRef<ChartJS>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format data for Chart.js consumption
  const formattedData = formatChartData(data, {
    type: 'line',
    theme: 'light', // TODO: Integrate with app theme
    enableAnimation: true,
    showLegend: true
  });

  // Generate chart options with defaults and custom settings
  const chartOptions = generateChartOptions('line', 'light', {
    ...chartConfig,
    ...options,
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    plugins: {
      ...chartConfig.plugins,
      tooltip: {
        ...chartConfig.plugins.tooltip,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(value);
          }
        }
      }
    },
    scales: {
      x: {
        ...chartConfig.scales.x,
        type: 'category',
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        ...chartConfig.scales.y,
        display: true,
        title: {
          display: true,
          text: 'Amount ($)'
        },
        ticks: {
          callback: (value: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(value);
          }
        }
      }
    }
  });

  return (
    <div 
      ref={containerRef}
      className={`line-chart-container ${className}`}
      style={{ 
        height: typeof height === 'number' ? `${height}px` : height,
        width: '100%'
      }}
      role="img"
      aria-label="Line chart visualization"
    >
      <Line
        ref={chartRef}
        data={formattedData}
        options={chartOptions}
        plugins={[
          {
            id: 'customCanvasBackgroundColor',
            beforeDraw: (chart) => {
              const ctx = chart.canvas.getContext('2d');
              if (ctx) {
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = 'white'; // TODO: Use theme background color
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
              }
            }
          }
        ]}
      />
    </div>
  );
};

export default LineChart;