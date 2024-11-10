/**
 * Chart constants and configurations for data visualization across the application
 * Addresses requirements:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 * - Budget Monitoring (Technical Specification/1.2 Scope/Core Features)
 * - Analytics and Reporting (Technical Specification/1.1 System Overview)
 */

import { BudgetPeriod, TransactionCategory } from '../types/models.types';

// Material Design color palette for consistent chart visualization
export const CHART_COLORS = {
  primary: '#1976D2',    // Primary brand color for main data series
  secondary: '#424242',  // Secondary color for supporting data
  success: '#4CAF50',    // Positive indicators (income, gains)
  warning: '#FFC107',    // Warning indicators (at-risk budgets)
  danger: '#F44336',     // Negative indicators (overspending)
  text: '#212121',       // Text and labels
  grid: '#E0E0E0',      // Grid lines and axes
  background: '#FFFFFF'  // Chart background
} as const;

// Standard chart dimensions and spacing for responsive layouts
export const CHART_DIMENSIONS = {
  defaultWidth: 600,     // Default chart width in pixels
  defaultHeight: 400,    // Default chart height in pixels
  margin: {
    top: 20,            // Top margin for titles
    right: 20,          // Right margin for labels
    bottom: 30,         // Bottom margin for x-axis
    left: 40            // Left margin for y-axis
  },
  padding: {
    top: 10,            // Internal top padding
    right: 10,          // Internal right padding
    bottom: 10,         // Internal bottom padding
    left: 10            // Internal left padding
  }
} as const;

// Available chart types for data visualization
export const CHART_TYPES = {
  LINE: 'line',         // Time series data (portfolio performance)
  BAR: 'bar',          // Categorical data (spending by category)
  DONUT: 'doughnut',   // Part-to-whole relationships (budget allocation)
  AREA: 'area'         // Cumulative data (savings growth)
} as const;

// Default chart configuration for consistent visualization
export const CHART_DEFAULTS = {
  animation: {
    duration: 750,                // Animation duration in milliseconds
    easing: 'easeInOutQuart'     // Animation easing function
  },
  responsive: true,               // Enable responsive resizing
  maintainAspectRatio: true,     // Maintain aspect ratio on resize
  plugins: {
    legend: {
      position: 'bottom',         // Legend position
      align: 'start'             // Legend alignment
    },
    tooltip: {
      enabled: true,             // Enable tooltips
      mode: 'index',             // Show all values at current index
      intersect: false           // Show tooltip without intersection
    }
  }
} as const;

// Time period options for chart data aggregation
export const CHART_PERIODS = {
  DAILY: 'daily',               // Daily data points
  WEEKLY: 'weekly',             // Weekly aggregation
  MONTHLY: 'monthly',           // Monthly aggregation
  QUARTERLY: 'quarterly',       // Quarterly aggregation
  YEARLY: 'yearly'             // Yearly aggregation
} as const;

// Category-specific colors for transaction visualization
export const TRANSACTION_CATEGORY_COLORS: Record<TransactionCategory, string> = {
  INCOME: CHART_COLORS.success,
  SHOPPING: '#FF9800',         // Orange
  GROCERIES: '#8BC34A',       // Light Green
  TRANSPORT: '#2196F3',       // Blue
  UTILITIES: '#9C27B0',       // Purple
  ENTERTAINMENT: '#FF5722',   // Deep Orange
  HEALTHCARE: '#00BCD4',      // Cyan
  OTHER: CHART_COLORS.secondary
} as const;

// Period-specific configurations for budget charts
export const BUDGET_PERIOD_CONFIG: Record<BudgetPeriod, { tickFormat: string; tooltipFormat: string }> = {
  WEEKLY: {
    tickFormat: 'ddd',         // Day abbreviation (Mon, Tue, etc.)
    tooltipFormat: 'MMM D'     // Month and day (Jan 1)
  },
  MONTHLY: {
    tickFormat: 'D',           // Day of month (1-31)
    tooltipFormat: 'MMM D'     // Month and day (Jan 1)
  },
  QUARTERLY: {
    tickFormat: 'MMM',         // Month abbreviation (Jan, Feb, etc.)
    tooltipFormat: 'MMM YYYY'  // Month and year (Jan 2024)
  },
  YEARLY: {
    tickFormat: 'MMM',         // Month abbreviation (Jan, Feb, etc.)
    tooltipFormat: 'MMM YYYY'  // Month and year (Jan 2024)
  }
} as const;

// Chart grid line configurations
export const CHART_GRID = {
  color: CHART_COLORS.grid,
  borderDash: [5, 5],          // Dashed line pattern
  drawBorder: false,           // Hide border
  drawTicks: true,             // Show tick marks
  tickLength: 5,               // Tick length in pixels
  zeroLineColor: CHART_COLORS.secondary,
  zeroLineWidth: 1
} as const;

// Font configurations for chart text elements
export const CHART_FONTS = {
  family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  size: {
    title: 16,
    label: 12,
    tick: 11,
    legend: 12
  },
  weight: {
    normal: 400,
    bold: 600
  }
} as const;