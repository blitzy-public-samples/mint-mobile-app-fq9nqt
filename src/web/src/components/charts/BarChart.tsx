/**
 * A reusable bar chart component using Chart.js for financial data visualization
 * Addresses requirements:
 * - Budget Monitoring (Technical Specification/1.2 Scope/Core Features)
 * - Analytics and Reporting (Technical Specification/1.1 System Overview)
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useEffect, useRef } from 'react';
// @version: chart.js ^4.0.0
import { Chart, ChartOptions } from 'chart.js/auto';
// @version: lodash ^4.17.21
import merge from 'lodash/merge';

// Internal imports
import { ChartProps } from '../../types/components.types';
import chartConfig from '../../config/chart.config';
import { formatChartData, generateChartOptions } from '../../utils/chart.utils';

// Human Tasks:
// 1. Verify Chart.js v4.0.0 is installed in package.json
// 2. Ensure lodash v4.17.21 is installed in package.json
// 3. Test accessibility features with screen readers
// 4. Validate responsive behavior across different screen sizes
// 5. Confirm theme integration with application's theme system

interface BarChartProps extends ChartProps {
  data: any[];
  options?: ChartOptions;
  height?: string;
  className?: string;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  options = {},
  height = '300px',
  className = '',
  responsive = true,
  maintainAspectRatio = true,
}) => {
  // Chart instance reference
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Format data for Chart.js consumption
    const formattedData = formatChartData(data, {
      type: 'bar',
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      enableAnimation: true
    });

    // Generate chart options with theme support
    const chartOptions = generateChartOptions('bar', 
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      merge({}, options, {
        responsive,
        maintainAspectRatio,
        plugins: {
          legend: {
            display: true,
            position: 'bottom' as const,
            labels: {
              generateLabels: (chart) => {
                const datasets = chart.data.datasets;
                return datasets.map((dataset, i) => ({
                  text: dataset.label || `Dataset ${i + 1}`,
                  fillStyle: Array.isArray(dataset.backgroundColor) 
                    ? dataset.backgroundColor[0] 
                    : dataset.backgroundColor,
                  hidden: !chart.isDatasetVisible(i),
                  lineCap: 'round',
                  fontColor: document.documentElement.classList.contains('dark') 
                    ? '#FFFFFF' 
                    : '#666666'
                }));
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
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
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0
                }).format(value as number);
              }
            }
          }
        }
      })
    );

    // Destroy existing chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart instance
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: formattedData,
        options: chartOptions
      });
    }

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, options, responsive, maintainAspectRatio]);

  // Handle theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      if (chartInstance.current) {
        const isDarkMode = document.documentElement.classList.contains('dark');
        const themeOptions = chartConfig.themeOptions[isDarkMode ? 'dark' : 'light'];
        
        chartInstance.current.options = merge({}, 
          chartInstance.current.options, 
          {
            plugins: {
              legend: {
                labels: {
                  color: themeOptions.textColor
                }
              }
            },
            scales: {
              x: {
                grid: {
                  color: themeOptions.gridColor
                },
                ticks: {
                  color: themeOptions.textColor
                }
              },
              y: {
                grid: {
                  color: themeOptions.gridColor
                },
                ticks: {
                  color: themeOptions.textColor
                }
              }
            }
          }
        );
        chartInstance.current.update();
      }
    };

    // Observer for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      className={`chart-container ${className}`}
      style={{ height, width: '100%' }}
      role="region"
      aria-label="Bar chart visualization"
    >
      <canvas
        ref={chartRef}
        role="img"
        aria-label="Financial data visualization in bar chart format"
      />
    </div>
  );
};

export default BarChart;