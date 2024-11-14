/**
 * A reusable donut chart component for visualizing proportional data
 * Addresses requirements:
 * - Budget Monitoring (Technical Specification/1.2 Scope/Core Features)
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useRef, useEffect } from 'react';
// @version: chart.js ^4.0.0
import { Chart } from 'chart.js/auto';
// @version: lodash ^4.17.21
import merge from 'lodash/merge';

// Internal imports
import { ChartProps } from '../../types/components.types';
// import chartConfig from '../../config/chart.config';
import { formatChartData, generateChartOptions } from '../../utils/chart.utils';

// Human Tasks:
// 1. Verify Chart.js and lodash versions in package.json
// 2. Ensure theme context is properly configured
// 3. Test accessibility features with screen readers
// 4. Validate responsive behavior on different screen sizes
// 5. Test touch interactions on mobile devices

interface DonutChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: string | number;
  options?: Partial<ChartProps['options']>;
  className?: string;
  ariaLabel?: string;
}

const DonutChart: React.FC<DonutChartProps> = React.memo(({
  data,
  height = 300,
  options = {},
  className = '',
  ariaLabel = 'Donut chart'
}) => {
  // Refs for canvas element and chart instance
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Format data for Chart.js
    const formattedData = formatChartData(data, {
      type: 'doughnut',
      customColors: data.map(item => item.color)
    });

    // Generate chart options with theme support
    const chartOptions = generateChartOptions('doughnut', 'light', merge({}, {
      cutout: '70%',
      radius: '90%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            generateLabels: (chart) => {
              const datasets = chart.data.datasets;
              return chart.data.labels?.map((label, index) => ({
                text: `${label}: ${datasets[0].data[index]}%`,
                fillStyle: datasets[0].backgroundColor?.[index],
                hidden: false,
                index
              })) || [];
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw as number;
              return `${context.label}: ${value.toFixed(1)}%`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true
      }
    }, options));

    // Initialize chart
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Cleanup previous chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Create new chart instance
    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: formattedData,
      options: chartOptions
    });

    // Cleanup on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [data, options]);

  // Handle responsive sizing
  useEffect(() => {
    const handleResize = () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      className={`donut-chart-container ${className}`}
      style={{ position: 'relative', height, width: '100%' }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        style={{ width: '100%', height: '100%' }}
      />
      {data.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#666'
          }}
        >
          No data available
        </div>
      )}
    </div>
  );
});

DonutChart.displayName = 'DonutChart';

export default DonutChart;