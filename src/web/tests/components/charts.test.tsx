/**
 * Test suite for chart components including AreaChart, BarChart, DonutChart, and LineChart
 * Addresses requirements:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 * - Budget Monitoring (Technical Specification/1.2 Scope/Core Features)
 * - Analytics and Reporting (Technical Specification/1.1 System Overview)
 */

// Third-party imports
// @version: react ^18.0.0
import React from 'react';
// @version: @testing-library/react ^13.0.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// @version: @jest/globals ^29.0.0
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
// @version: chart.js ^4.0.0
import { Chart } from 'chart.js';

// Internal imports
import AreaChart, { AreaChartProps } from '../../src/components/charts/AreaChart';
import BarChart, { BarChartProps } from '../../src/components/charts/BarChart';
import DonutChart, { DonutChartProps } from '../../src/components/charts/DonutChart';
import LineChart, { LineChartProps } from '../../src/components/charts/LineChart';
import { formatChartData } from '../../src/utils/chart.utils';

// Mock Chart.js to avoid canvas rendering issues
jest.mock('chart.js', () => ({
  Chart: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    update: jest.fn(),
    resize: jest.fn(),
    data: {},
    options: {}
  })),
  register: jest.fn()
}));

// Mock ResizeObserver for responsive tests
const mockResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

global.ResizeObserver = mockResizeObserver;

// Test data
const mockAreaChartData = [
  { x: '2023-01', y: 1000 },
  { x: '2023-02', y: 1500 },
  { x: '2023-03', y: 1200 }
];

const mockBarChartData = [
  { category: 'Food', amount: 500 },
  { category: 'Transport', amount: 300 },
  { category: 'Entertainment', amount: 200 }
];

const mockDonutChartData = [
  { label: 'Stocks', value: 60 },
  { label: 'Bonds', value: 30 },
  { label: 'Cash', value: 10 }
];

const mockLineChartData = [
  { x: '2023-01', y: 5000 },
  { x: '2023-02', y: 5500 },
  { x: '2023-03', y: 6000 }
];

describe('AreaChart', () => {
  beforeEach(() => {
    (Chart as jest.Mock).mockClear();
  });

  test('renders with default props', () => {
    render(<AreaChart data={mockAreaChartData} options={{}} />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  test('applies custom dimensions', () => {
    const height = '400px';
    render(<AreaChart data={mockAreaChartData} options={{}} height={height} />);
    const container = screen.getByTestId('area-chart').parentElement;
    expect(container).toHaveStyle({ height });
  });

  test('handles data updates and re-rendering', async () => {
    const { rerender } = render(<AreaChart data={mockAreaChartData} options={{}} />);
    
    const updatedData = [...mockAreaChartData, { x: '2023-04', y: 1800 }];
    rerender(<AreaChart data={updatedData} options={{}} />);
    
    expect(Chart).toHaveBeenCalledTimes(2);
  });

  test('cleans up chart instance on unmount', () => {
    const { unmount } = render(<AreaChart data={mockAreaChartData} options={{}} />);
    const mockChart = (Chart as jest.Mock).mock.results[0].value;
    
    unmount();
    expect(mockChart.destroy).toHaveBeenCalled();
  });

  test('applies gradient fill', () => {
    const fillColor = '#ff0000';
    render(<AreaChart data={mockAreaChartData} options={{}} fillColor={fillColor} />);
    
    const chartConfig = (Chart as jest.Mock).mock.calls[0][1];
    expect(chartConfig.data.datasets[0].borderColor).toBe(fillColor);
  });
});

describe('BarChart', () => {
  beforeEach(() => {
    (Chart as jest.Mock).mockClear();
  });

  test('renders with default props', () => {
    render(<BarChart data={mockBarChartData} />);
    const canvas = screen.getByRole('img', { name: /financial data visualization/i });
    expect(canvas).toBeInTheDocument();
  });

  test('applies theme-based styling', async () => {
    render(<BarChart data={mockBarChartData} />);
    
    // Simulate theme change
    document.documentElement.classList.add('dark');
    await waitFor(() => {
      const chartInstance = (Chart as jest.Mock).mock.results[0].value;
      expect(chartInstance.update).toHaveBeenCalled();
    });
  });

  test('handles responsive resizing', async () => {
    render(<BarChart data={mockBarChartData} responsive={true} />);
    
    // Simulate resize event
    fireEvent(window, new Event('resize'));
    await waitFor(() => {
      const chartInstance = (Chart as jest.Mock).mock.results[0].value;
      expect(chartInstance.resize).toHaveBeenCalled();
    });
  });

  test('formats currency values correctly', () => {
    render(<BarChart data={mockBarChartData} />);
    
    const chartConfig = (Chart as jest.Mock).mock.calls[0][1];
    const formatter = chartConfig.options.scales.y.ticks.callback;
    expect(formatter(1000)).toBe('$1,000');
  });

  test('handles empty data gracefully', () => {
    render(<BarChart data={[]} />);
    const chartConfig = (Chart as jest.Mock).mock.calls[0][1];
    expect(chartConfig.data.datasets[0].data).toHaveLength(0);
  });
});

describe('DonutChart', () => {
  beforeEach(() => {
    (Chart as jest.Mock).mockClear();
  });

  test('renders with default props', () => {
    render(<DonutChart data={mockDonutChartData} />);
    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });

  test('displays custom legend labels', () => {
    render(<DonutChart data={mockDonutChartData} />);
    
    const chartConfig = (Chart as jest.Mock).mock.calls[0][1];
    const legendLabels = chartConfig.options.plugins.legend.labels.generateLabels({
      data: chartConfig.data
    });
    
    expect(legendLabels[0].text).toContain('Stocks');
    expect(legendLabels[0].text).toContain('60%');
  });

  test('handles segment calculations correctly', () => {
    render(<DonutChart data={mockDonutChartData} />);
    
    const chartConfig = (Chart as jest.Mock).mock.calls[0][1];
    const total = chartConfig.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
    expect(total).toBe(100);
  });

  test('applies custom colors', () => {
    const customColors = ['#ff0000', '#00ff00', '#0000ff'];
    render(<DonutChart 
      data={mockDonutChartData.map((item, i) => ({ ...item, color: customColors[i] }))} 
    />);
    
    const chartConfig = (Chart as jest.Mock).mock.calls[0][1];
    expect(chartConfig.data.datasets[0].backgroundColor).toEqual(customColors);
  });

  test('displays no data message when empty', () => {
    render(<DonutChart data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});

describe('LineChart', () => {
  beforeEach(() => {
    (Chart as jest.Mock).mockClear();
  });

  test('renders with default props', () => {
    render(<LineChart data={mockLineChartData} />);
    const canvas = screen.getByRole('img', { name: /line chart visualization/i });
    expect(canvas).toBeInTheDocument();
  });

  test('formats time series data correctly', () => {
    render(<LineChart data={mockLineChartData} />);
    
    const chartConfig = (Chart as jest.Mock).mock.calls[0][1];
    expect(chartConfig.data.labels).toHaveLength(mockLineChartData.length);
    expect(chartConfig.data.datasets[0].data).toHaveLength(mockLineChartData.length);
  });

  test('configures axis settings properly', () => {
    render(<LineChart data={mockLineChartData} />);
    
    const chartConfig = (Chart as jest.Mock).mock.calls[0][1];
    expect(chartConfig.options.scales.x.title.text).toBe('Date');
    expect(chartConfig.options.scales.y.title.text).toBe('Amount ($)');
  });

  test('handles zoom and pan interactions', () => {
    render(<LineChart data={mockLineChartData} />);
    
    const chartConfig = (Chart as jest.Mock).mock.calls[0][1];
    expect(chartConfig.options.interaction.mode).toBe('nearest');
    expect(chartConfig.options.interaction.axis).toBe('x');
  });

  test('applies responsive updates', async () => {
    render(<LineChart data={mockLineChartData} />);
    
    // Simulate resize event
    fireEvent(window, new Event('resize'));
    await waitFor(() => {
      const chartInstance = (Chart as jest.Mock).mock.results[0].value;
      expect(chartInstance.resize).toHaveBeenCalled();
    });
  });
});

describe('Chart Utils', () => {
  test('formats data correctly for different chart types', () => {
    // Test area chart data formatting
    const areaData = formatChartData(mockAreaChartData, { type: 'area' });
    expect(areaData.datasets[0].fill).toBe(true);
    
    // Test bar chart data formatting
    const barData = formatChartData(mockBarChartData, { type: 'bar' });
    expect(barData.datasets[0].backgroundColor).toHaveLength(mockBarChartData.length);
    
    // Test donut chart data formatting
    const donutData = formatChartData(mockDonutChartData, { type: 'doughnut' });
    expect(donutData.labels).toHaveLength(mockDonutChartData.length);
    
    // Test line chart data formatting
    const lineData = formatChartData(mockLineChartData, { type: 'line' });
    expect(lineData.datasets[0].tension).toBe(0.4);
  });

  test('handles invalid data gracefully', () => {
    expect(() => formatChartData([], { type: 'line' }))
      .toThrow('Invalid data format: Expected non-empty array');
  });

  test('applies theme-based colors', () => {
    const darkThemeData = formatChartData(mockLineChartData, { 
      type: 'line', 
      theme: 'dark' 
    });
    expect(darkThemeData.datasets[0].borderColor).toBeDefined();
  });
});