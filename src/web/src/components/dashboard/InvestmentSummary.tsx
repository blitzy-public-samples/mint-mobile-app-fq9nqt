/**
 * A dashboard component that displays a summary of the user's investment portfolio
 * with performance metrics and asset allocation visualization.
 * 
 * Requirements addressed:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 *   Implements basic investment portfolio tracking with holdings and value tracking
 * - Dashboard Components (Technical Specification/8.1.2 Main Dashboard)
 *   Provides real-time investment performance metrics visualization
 * - Asset Allocation (Technical Specification/8.1.5 Investment Dashboard)
 *   Displays interactive donut chart for portfolio allocation
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useMemo, useCallback } from 'react';
// @version: currency-formatter ^2.0.0
import formatCurrency from 'currency-formatter';

// Internal imports
import Card from '../common/Card';
import DonutChart from '../charts/DonutChart';
import { Investment } from '../../types/models.types';
import { useInvestments } from '../../hooks/useInvestments';

// Human tasks:
// 1. Verify currency formatting configuration for all supported currencies
// 2. Test color contrast ratios for performance indicators
// 3. Validate chart accessibility with screen readers
// 4. Test responsive behavior on different screen sizes
// 5. Configure performance monitoring for investment data loading

interface InvestmentSummaryProps {
  className?: string;
  testId?: string;
}

interface AssetAllocationData {
  label: string;
  value: number;
  color: string;
}

const InvestmentSummary: React.FC<InvestmentSummaryProps> = React.memo(({
  className = '',
  testId = 'investment-summary'
}) => {
  // Fetch investment data using the useInvestments hook
  const { investments, loading, error, fetchInvestments } = useInvestments();

  /**
   * Calculates portfolio performance metrics from investment data
   * Returns total value, gain/loss, and percentage return
   */
  const calculatePortfolioMetrics = useCallback((investments: Investment[]) => {
    return investments.reduce((metrics, investment) => {
      const currentValue = investment.quantity * investment.currentPrice;
      const costBasis = investment.costBasis;
      const gainLoss = currentValue - costBasis;
      const percentageReturn = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      return {
        totalValue: metrics.totalValue + currentValue,
        totalGainLoss: metrics.totalGainLoss + gainLoss,
        percentageReturn: metrics.percentageReturn + percentageReturn,
      };
    }, {
      totalValue: 0,
      totalGainLoss: 0,
      percentageReturn: 0,
    });
  }, []);

  /**
   * Transforms investment data into chart-ready format for visualization
   * Groups investments by symbol and calculates allocation percentages
   */
  const prepareAssetAllocationData = useCallback((investments: Investment[]): AssetAllocationData[] => {
    // Calculate total portfolio value
    const totalValue = investments.reduce((sum, inv) =>
      sum + (inv.quantity * inv.currentPrice), 0);

    // Group investments by symbol and calculate allocations
    const allocations = investments.reduce((acc, inv) => {
      const value = inv.quantity * inv.currentPrice;
      const percentage = (value / totalValue) * 100;

      return [...acc, {
        label: inv.symbol,
        value: Number(percentage.toFixed(2)),
        color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Generate distinct colors
      }];
    }, [] as AssetAllocationData[]);

    // Sort by allocation percentage descending
    return allocations.sort((a, b) => b.value - a.value);
  }, []);

  // Memoize portfolio metrics calculation
  const portfolioMetrics = useMemo(() => {
    if (!investments.length) return null;
    return calculatePortfolioMetrics(investments);
  }, [investments, calculatePortfolioMetrics]);

  // Memoize asset allocation data preparation
  const allocationData = useMemo(() => {
    if (!investments.length) return [];
    return prepareAssetAllocationData(investments);
  }, [investments, prepareAssetAllocationData]);

  // Chart configuration
  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.raw}%`;
          },
        },
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      }
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Format currency values for display
  const formatValue = (value: number) => {
    return formatCurrency.format(value, { code: 'USD' });
  };

  // Render loading state or error message if necessary
  if (error) {
    return (
      <Card
        title="Investment Summary"
        className={className}
        testId={testId}
      >
        <div className="error-message">
          Failed to load investment data. Please try again later.
        </div>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-text-primary text-center">Investment Summary</h2>

      <Card
        className={className}
        testId={testId}
        loading={loading}
      >
        <div className="investment-summary">
          {/* Portfolio Value Section */}
          <div className="portfolio-metrics">
            <div className="metric-item">
              <h3>Total Portfolio Value</h3>
              <span className="value">
                {portfolioMetrics ? formatValue(portfolioMetrics.totalValue) : '$0.00'}
              </span>
            </div>

            {portfolioMetrics && (
              <>
                <div className="metric-item">
                  <h3>Total Gain/Loss</h3>
                  <span className={`value ${portfolioMetrics.totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
                    {formatValue(portfolioMetrics.totalGainLoss)}
                  </span>
                </div>

                <div className="metric-item">
                  <h3>Return</h3>
                  <span className={`value ${portfolioMetrics.percentageReturn >= 0 ? 'positive' : 'negative'}`}>
                    {portfolioMetrics.percentageReturn.toFixed(2)}%
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Asset Allocation Chart */}
          <div className="allocation-chart">
            <h3>Asset Allocation</h3>
            <DonutChart
              data={allocationData}
              options={chartOptions}
              height={300}
              ariaLabel="Investment portfolio asset allocation chart"
            />
          </div>
        </div>

        <style jsx>{`
        .investment-summary {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .portfolio-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .metric-item {
          text-align: center;
        }

        .metric-item h3 {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.5rem;
        }

        .value {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .positive {
          color: var(--color-success-400);
        }

        .negative {
          color: var(--color-error);
        }

        .allocation-chart {
          min-height: 300px;
        }

        .allocation-chart h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        .error-message {
          color: var(--color-error);
          text-align: center;
          padding: 2rem;
        }

        @media (min-width: 768px) {
          .investment-summary {
            flex-direction: row;
          }

          .portfolio-metrics {
            flex: 1;
          }

          .allocation-chart {
            flex: 1;
          }
        }
      `}</style>
      </Card>
    </div>
  );
});

InvestmentSummary.displayName = 'InvestmentSummary';

export default InvestmentSummary;