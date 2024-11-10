/**
 * Area Chart Component for visualizing time-series data in Mint Replica Lite
 * Addresses requirements:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 * - Budget Monitoring (Technical Specification/1.2 Scope/Core Features)
 * - Analytics and Reporting (Technical Specification/1.1 System Overview)
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useRef, useEffect, memo } from 'react';
// @version: chart.js ^4.0.0
import { Chart, ChartType } from 'chart.js';
// @version: lodash ^4.17.21
import merge from 'lodash/merge';

// Internal imports
import { formatChartData, generateChartOptions, createChartGradient } from '../../utils/chart.utils';
import { CHART_COLORS, CHART_DIMENSIONS } from '../../constants/chart.constants';
import type { ChartProps } from '../../types/components.types';

// Human Tasks:
// 1. Verify Chart.js and required plugins are installed in package.json
// 2. Ensure chart theme colors match application theme
// 3. Test responsive behavior across different screen sizes
// 4. Validate data formatting matches backend API response structure
// 5. Configure Chart.js performance optimizations if needed

interface AreaChartProps extends ChartProps {
  data: Array<{ x: string | number; y: number }>;
  options: ChartOptions;
  height?: string | number;
  fillColor?: string;
  lineColor?: string;
}

/**
 * Custom hook for chart initialization and cleanup
 */
const useChartSetup = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  data: AreaChartProps['data'],
  options: AreaChartProps['options']
): Chart | null => {
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Format data for Chart.js consumption
    const formattedData = formatChartData(data, {
      type: 'area' as ChartType,
      customColors: [options.fillColor || CHART_COLORS.primary]
    });

    // Generate chart options with defaults
    const chartOptions = generateChartOptions('line', 'light', merge({}, options, {
      plugins: {
        tooltip: {
          intersect: false,
          mode: 'index'
        }
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: CHART_COLORS.grid
          }
        },
        y: {
          grid: {
            display: true,
            color: CHART_COLORS.grid
          },
          beginAtZero: true
        }
      }
    }));

    // Create and store chart instance
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        ...formattedData,
        datasets: [{
          ...formattedData.datasets[0],
          fill: true,
          backgroundColor: createChartGradient(ctx, [
            options.fillColor || CHART_COLORS.primary
          ]),
          borderColor: options.lineColor || CHART_COLORS.primary,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4
        }]
      },
      options: chartOptions
    });

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [canvasRef, data, options]);

  return chartInstance.current;
};

/**
 * Area Chart component for visualizing time-series data
 */
const AreaChart: React.FC<AreaChartProps> = memo(({
  data,
  options,
  height = CHART_DIMENSIONS.defaultHeight,
  fillColor,
  lineColor,
  responsive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize chart using custom hook
  useChartSetup(canvasRef, data, {
    ...options,
    fillColor,
    lineColor
  });

  return (
    <div 
      style={{ 
        height: typeof height === 'number' ? `${height}px` : height,
        width: '100%',
        position: 'relative'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%'
        }}
        data-testid="area-chart"
      />
    </div>
  );
});

// Display name for debugging
AreaChart.displayName = 'AreaChart';

export default AreaChart;