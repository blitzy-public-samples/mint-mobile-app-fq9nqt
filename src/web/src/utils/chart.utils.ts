/**
 * Chart utility functions for data visualization in Mint Replica Lite
 * Addresses requirements:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 * - Budget Monitoring (Technical Specification/1.2 Scope/Core Features)
 * - Analytics and Reporting (Technical Specification/1.1 System Overview)
 */

// Third-party imports
import { Chart, ChartData, ChartOptions, ChartType } from 'chart.js'; // v4.0.0
import merge from 'lodash/merge'; // v4.17.21

// Internal imports
import { CHART_COLORS, CHART_DIMENSIONS, TRANSACTION_CATEGORY_COLORS, BUDGET_PERIOD_CONFIG } from '../constants/chart.constants';
import chartConfig from '../config/chart.config';

// Types
interface FormatOptions {
  type: ChartType;
  theme?: 'light' | 'dark';
  period?: keyof typeof BUDGET_PERIOD_CONFIG;
  showLegend?: boolean;
  enableAnimation?: boolean;
  customColors?: string[];
}

interface ChartDimensions {
  width: number;
  height: number;
  margin: typeof CHART_DIMENSIONS.margin;
  padding: typeof CHART_DIMENSIONS.padding;
}

/**
 * Formats raw data into Chart.js compatible structure with theme support
 * Addresses requirement: Analytics and Reporting - Enable analytics and reporting engine
 */
export function formatChartData(data: any[], options: FormatOptions): ChartData {
  // Validate input data
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid data format: Expected non-empty array');
  }

  // Initialize base chart data structure
  const chartData: ChartData = {
    labels: [],
    datasets: []
  };

  // Apply chart type specific formatting
  switch (options.type) {
    case 'line':
    case 'area': {
      // Extract labels and values
      chartData.labels = data.map(item => item.label);
      chartData.datasets = [{
        data: data.map(item => item.value),
        borderColor: options.customColors?.[0] || CHART_COLORS.primary,
        backgroundColor: options.type === 'area' 
          ? createChartGradient(document.createElement('canvas').getContext('2d')!, 
              [options.customColors?.[0] || CHART_COLORS.primary])
          : 'transparent',
        fill: options.type === 'area',
        tension: 0.4
      }];
      break;
    }
    case 'bar': {
      chartData.labels = data.map(item => item.category);
      chartData.datasets = [{
        data: data.map(item => item.amount),
        backgroundColor: data.map(item => 
          TRANSACTION_CATEGORY_COLORS[item.category] || CHART_COLORS.secondary
        )
      }];
      break;
    }
    case 'doughnut': {
      chartData.labels = data.map(item => item.label);
      chartData.datasets = [{
        data: data.map(item => item.value),
        backgroundColor: options.customColors || 
          Object.values(CHART_COLORS).slice(0, data.length)
      }];
      break;
    }
    default:
      throw new Error(`Unsupported chart type: ${options.type}`);
  }

  return chartData;
}

/**
 * Generates chart options by merging defaults with custom settings
 * Addresses requirement: Investment Portfolio Tracking - Support for multiple chart types
 */
export function generateChartOptions(
  type: ChartType,
  theme: 'light' | 'dark' = 'light',
  customOptions: Partial<ChartOptions> = {}
): ChartOptions {
  const baseOptions = chartConfig.createConfig(type, customOptions, theme === 'dark');

  // Apply chart type specific options
  const typeSpecificOptions: Partial<ChartOptions> = {
    scales: type === 'doughnut' ? undefined : {
      x: {
        grid: {
          display: type === 'line' || type === 'area',
          color: theme === 'dark' ? '#333333' : CHART_COLORS.grid
        }
      },
      y: {
        grid: {
          display: true,
          color: theme === 'dark' ? '#333333' : CHART_COLORS.grid
        },
        ticks: {
          callback: (value) => {
            // Format currency values
            return typeof value === 'number' ? 
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(value) : value;
          }
        }
      }
    }
  };

  return merge({}, baseOptions, typeSpecificOptions, customOptions);
}

/**
 * Creates gradient fills for chart backgrounds
 * Addresses requirement: Budget Monitoring - Enhanced visualization
 */
export function createChartGradient(
  ctx: CanvasRenderingContext2D,
  colors: string[]
): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  
  colors.forEach((color, index) => {
    const alpha = index === 0 ? '40' : '00';
    gradient.addColorStop(index / (colors.length - 1), `${color}${alpha}`);
  });

  return gradient;
}

/**
 * Calculates responsive dimensions for charts
 * Addresses requirement: Analytics and Reporting - Responsive layouts
 */
export function calculateChartDimensions(
  containerWidth: number,
  containerHeight: number
): ChartDimensions {
  // Get base dimensions from config
  const baseDimensions = chartConfig.getDimensions(containerWidth);

  // Apply responsive constraints
  const width = Math.min(
    containerWidth - (baseDimensions.margin.left + baseDimensions.margin.right),
    CHART_DIMENSIONS.defaultWidth
  );

  const height = Math.min(
    containerHeight - (baseDimensions.margin.top + baseDimensions.margin.bottom),
    CHART_DIMENSIONS.defaultHeight
  );

  // Maintain minimum dimensions
  const minWidth = 200;
  const minHeight = 150;

  return {
    width: Math.max(width, minWidth),
    height: Math.max(height, minHeight),
    margin: CHART_DIMENSIONS.margin,
    padding: CHART_DIMENSIONS.padding
  };
}

// Human Tasks:
// 1. Ensure Chart.js v4.0.0 is installed in package.json
// 2. Ensure lodash v4.17.21 is installed in package.json
// 3. Configure Chart.js plugins if additional features are needed
// 4. Verify theme configuration matches application's theme system
// 5. Test responsive behavior across different device sizes
// 6. Validate currency formatting matches application's locale settings