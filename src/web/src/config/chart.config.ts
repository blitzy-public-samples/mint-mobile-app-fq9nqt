/**
 * Centralized chart configuration for the Mint Replica Lite web application
 * Addresses requirements:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 * - Budget Monitoring (Technical Specification/1.2 Scope/Core Features)
 * - Analytics and Reporting (Technical Specification/1.1 System Overview)
 */

// Third-party imports
import { Chart } from 'chart.js'; // v4.0.0
import merge from 'lodash/merge'; // v4.17.21

// Internal imports
import {
  CHART_COLORS,
  CHART_DIMENSIONS,
  CHART_TYPES,
  CHART_DEFAULTS
} from '../constants/chart.constants';

// Default chart configuration
export const defaultOptions = {
  responsive: true,
  maintainAspectRatio: true,
  animation: {
    duration: 750,
    easing: 'easeInOutQuart'
  },
  plugins: {
    legend: {
      position: 'bottom',
      align: 'start',
      labels: {
        padding: 20,
        usePointStyle: true,
        color: CHART_COLORS.text,
        font: {
          family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      }
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      padding: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: CHART_COLORS.background,
      bodyColor: CHART_COLORS.background,
      borderColor: CHART_COLORS.grid,
      borderWidth: 1
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        padding: 10,
        color: CHART_COLORS.text
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        borderDash: [2, 2],
        color: CHART_COLORS.grid
      },
      ticks: {
        padding: 10,
        color: CHART_COLORS.text
      }
    }
  }
};

// Theme-specific chart configurations
export const themeOptions = {
  light: {
    backgroundColor: CHART_COLORS.background,
    borderColor: CHART_COLORS.grid,
    textColor: CHART_COLORS.text,
    gridColor: CHART_COLORS.grid
  },
  dark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#424242',
    textColor: '#FFFFFF',
    gridColor: '#333333'
  }
};

// Responsive breakpoint configurations
export const responsiveOptions = {
  mobile: {
    maxWidth: 480,
    options: {
      maintainAspectRatio: false,
      aspectRatio: 1,
      legend: {
        display: false
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  },
  tablet: {
    maxWidth: 768,
    options: {
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      legend: {
        display: true,
        position: 'bottom'
      }
    }
  },
  desktop: {
    options: {
      maintainAspectRatio: true,
      aspectRatio: 2,
      legend: {
        display: true,
        position: 'bottom'
      }
    }
  }
};

// Chart configuration factory with theme and responsive support
const chartConfig = {
  defaultOptions,
  themeOptions,
  responsiveOptions,

  // Helper method to create chart configuration with theme and responsive options
  createConfig(type: keyof typeof CHART_TYPES, customOptions = {}, isDarkMode = false) {
    const themeConfig = isDarkMode ? this.themeOptions.dark : this.themeOptions.light;
    
    // Get responsive config based on window width
    const getResponsiveConfig = () => {
      const width = window.innerWidth;
      if (width <= this.responsiveOptions.mobile.maxWidth) {
        return this.responsiveOptions.mobile.options;
      } else if (width <= this.responsiveOptions.tablet.maxWidth) {
        return this.responsiveOptions.tablet.options;
      }
      return this.responsiveOptions.desktop.options;
    };

    // Merge configurations in order of precedence
    return merge(
      {},
      this.defaultOptions,
      {
        type,
        options: {
          plugins: {
            legend: {
              labels: {
                color: themeConfig.textColor
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: themeConfig.gridColor
              },
              ticks: {
                color: themeConfig.textColor
              }
            },
            y: {
              grid: {
                color: themeConfig.gridColor
              },
              ticks: {
                color: themeConfig.textColor
              }
            }
          }
        }
      },
      getResponsiveConfig(),
      customOptions
    );
  },

  // Dimension helper methods
  getDimensions(containerWidth: number) {
    const width = Math.min(containerWidth, CHART_DIMENSIONS.defaultWidth);
    const height = (width * CHART_DIMENSIONS.defaultHeight) / CHART_DIMENSIONS.defaultWidth;
    return {
      width,
      height,
      margin: CHART_DIMENSIONS.margin,
      padding: CHART_DIMENSIONS.padding
    };
  }
};

export default chartConfig;