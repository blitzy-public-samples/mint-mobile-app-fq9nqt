/**
 * SpendingTrends component for visualizing spending patterns over time
 * Implements requirements:
 * - Budget Monitoring (Technical Specification/1.2 Scope/Core Features)
 * - Analytics and Reporting (Technical Specification/1.1 System Overview)
 * - User Interface Design (Technical Specification/8.1 User Interface Design/8.1.2 Main Dashboard)
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useState, useEffect } from 'react';

// Internal imports
import BarChart from '../charts/BarChart';
import { useTransactions } from '../../hooks/useTransactions';
import { formatCurrency } from '../../utils/currency.utils';
import type { Transaction } from '../../types/models.types';

// Human Tasks:
// 1. Verify Chart.js is properly configured for responsive displays
// 2. Test accessibility features with screen readers
// 3. Validate currency formatting across different locales
// 4. Monitor real-time update performance with large datasets
// 5. Review color contrast ratios for data visualization

interface SpendingTrendsProps {
  timeframe: string; // 'monthly' | 'yearly'
  className?: string;
}

interface SpendingData {
  labels: string[];
  values: number[];
  categories: string[];
}

const SpendingTrends: React.FC<SpendingTrendsProps> = ({
  timeframe,
  className = ''
}) => {
  // State for processed spending data
  const [spendingData, setSpendingData] = useState<SpendingData>({
    labels: [],
    values: [],
    categories: []
  });

  // Fetch transactions using the hook
  const { transactions, loading, error } = useTransactions({
    startDate: getTimeframeStartDate(timeframe),
    endDate: new Date()
  });

  // Process transaction data when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      const processedData = processTransactionData(transactions, timeframe);
      setSpendingData(processedData);
    }
  }, [transactions, timeframe]);

  // Helper function to get start date based on timeframe
  function getTimeframeStartDate(timeframe: string): Date {
    const now = new Date();
    if (timeframe === 'yearly') {
      return new Date(now.getFullYear() - 1, now.getMonth(), 1);
    }
    // Default to monthly
    return new Date(now.getFullYear(), now.getMonth() - 11, 1);
  }

  // Process raw transaction data into chart-ready format
  function processTransactionData(transactions: Transaction[], timeframe: string): SpendingData {
    const groupedData = new Map<string, number>();
    const categories = new Set<string>();

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group transactions by time period
    sortedTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const periodKey = timeframe === 'yearly'
        ? date.getFullYear().toString()
        : `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      const currentAmount = groupedData.get(periodKey) || 0;
      groupedData.set(periodKey, currentAmount + transaction.amount);

      if (transaction.category) {
        categories.add(transaction.category);
      }
    });

    // Generate labels and values arrays
    const labels: string[] = [];
    const values: number[] = [];

    // Create sorted array of period keys
    const sortedPeriods = Array.from(groupedData.keys()).sort();

    sortedPeriods.forEach(period => {
      const amount = groupedData.get(period) || 0;
      
      // Format label based on timeframe
      const label = timeframe === 'yearly'
        ? period
        : new Date(period).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      labels.push(label);
      values.push(amount);
    });

    return {
      labels,
      values,
      categories: Array.from(categories)
    };
  }

  // Configure chart options
  const chartOptions = {
    plugins: {
      title: {
        display: true,
        text: `Spending Trends (${timeframe === 'yearly' ? 'Yearly' : 'Monthly'})`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return formatCurrency(context.raw);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => formatCurrency(value)
        }
      }
    }
  };

  // Prepare chart data
  const chartData = {
    labels: spendingData.labels,
    datasets: [{
      label: 'Total Spending',
      data: spendingData.values,
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  if (loading) {
    return (
      <div className={`spending-trends-loading ${className}`}>
        <p>Loading spending trends...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`spending-trends-error ${className}`}>
        <p>Error loading spending trends: {error}</p>
      </div>
    );
  }

  if (!spendingData.labels.length) {
    return (
      <div className={`spending-trends-empty ${className}`}>
        <p>No spending data available for the selected timeframe.</p>
      </div>
    );
  }

  return (
    <div 
      className={`spending-trends ${className}`}
      role="region"
      aria-label={`Spending trends ${timeframe} visualization`}
    >
      <BarChart
        data={chartData}
        options={chartOptions}
        height="400px"
        responsive={true}
        maintainAspectRatio={false}
      />
      <div className="spending-trends-summary">
        <p>
          Total Spending: {formatCurrency(spendingData.values.reduce((a, b) => a + b, 0))}
        </p>
        <p>
          Average per Period: {formatCurrency(
            spendingData.values.reduce((a, b) => a + b, 0) / spendingData.values.length
          )}
        </p>
      </div>
    </div>
  );
};

export default SpendingTrends;