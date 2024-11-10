/**
 * Investment portfolio page component that displays detailed investment holdings,
 * asset allocation, and performance metrics.
 * 
 * Requirements addressed:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 * - Investment Data Management (Technical Specification/6.1.1 Core Application Components)
 * - User Interface Design (Technical Specification/8.1.5 Investment Dashboard)
 */

// @version: react ^18.0.0
import React, { useEffect, useState, useMemo } from 'react';

// Internal imports
import { useInvestments } from '../../hooks/useInvestments';
import DonutChart from '../../components/charts/DonutChart';
import Card from '../../components/common/Card';
import { Investment } from '../../types/models.types';

// Human Tasks:
// 1. Set up error tracking for investment data fetching failures
// 2. Configure performance monitoring for chart rendering
// 3. Verify accessibility compliance with screen readers
// 4. Test responsive layout on various screen sizes
// 5. Validate color contrast ratios for asset allocation chart

// Interface for portfolio performance metrics
interface PortfolioPerformance {
  totalValue: number;
  returnRate: number;
  gainLoss: number;
  lastUpdated: Date;
}

// Interface for asset allocation data
interface AssetAllocation {
  label: string;
  value: number;
  color: string;
}

const Portfolio: React.FC = () => {
  // Initialize hooks and state
  const { 
    investments, 
    loading, 
    error, 
    syncing, 
    fetchInvestments, 
    fetchPerformance 
  } = useInvestments();

  const [performance, setPerformance] = useState<PortfolioPerformance>({
    totalValue: 0,
    returnRate: 0,
    gainLoss: 0,
    lastUpdated: new Date()
  });

  // Calculate asset allocation from investments
  const calculateAssetAllocation = (investments: Investment[]): AssetAllocation[] => {
    const totalValue = investments.reduce((sum, inv) => 
      sum + (inv.quantity * inv.currentPrice), 0);

    // Group investments by symbol and calculate percentages
    const allocationMap = investments.reduce((acc, inv) => {
      const value = inv.quantity * inv.currentPrice;
      const percentage = (value / totalValue) * 100;
      
      return {
        ...acc,
        [inv.symbol]: {
          label: inv.symbol,
          value: percentage,
          color: generateColorForSymbol(inv.symbol) // Utility function to generate consistent colors
        }
      };
    }, {} as Record<string, AssetAllocation>);

    // Sort allocations by value in descending order
    return Object.values(allocationMap).sort((a, b) => b.value - a.value);
  };

  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Format percentage values
  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };

  // Generate consistent colors for symbols
  const generateColorForSymbol = (symbol: string): string => {
    const colors = [
      '#4299E1', '#48BB78', '#ED8936', '#9F7AEA',
      '#ED64A6', '#38B2AC', '#F56565', '#ECC94B'
    ];
    const index = symbol.split('').reduce((acc, char) => 
      acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Memoize asset allocation calculation
  const assetAllocation = useMemo(() => 
    calculateAssetAllocation(investments), [investments]);

  // Fetch investment data and performance metrics on mount
  useEffect(() => {
    const loadData = async () => {
      await fetchInvestments();
      try {
        const perf = await fetchPerformance('all', '1Y');
        setPerformance(perf);
      } catch (err) {
        console.error('Failed to fetch performance metrics:', err);
      }
    };
    loadData();
  }, [fetchInvestments, fetchPerformance]);

  if (error) {
    return (
      <Card title="Investment Portfolio" className="portfolio-error">
        <div className="error-message">
          Failed to load investment data. Please try again later.
        </div>
      </Card>
    );
  }

  return (
    <div className="portfolio-container">
      {/* Portfolio Summary Card */}
      <Card 
        title="Portfolio Summary" 
        loading={loading} 
        className="portfolio-summary"
      >
        <div className="summary-grid">
          <div className="summary-item">
            <label>Total Value</label>
            <span className="value">{formatCurrency(performance.totalValue)}</span>
          </div>
          <div className="summary-item">
            <label>Return Rate</label>
            <span className={`value ${performance.returnRate >= 0 ? 'positive' : 'negative'}`}>
              {formatPercentage(performance.returnRate)}
            </span>
          </div>
          <div className="summary-item">
            <label>Gain/Loss</label>
            <span className={`value ${performance.gainLoss >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(performance.gainLoss)}
            </span>
          </div>
          <div className="summary-item">
            <label>Last Updated</label>
            <span className="value">
              {performance.lastUpdated.toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Asset Allocation Chart */}
      <Card 
        title="Asset Allocation" 
        loading={loading} 
        className="asset-allocation"
      >
        <DonutChart
          data={assetAllocation}
          height={300}
          options={{
            plugins: {
              legend: {
                position: 'right',
                align: 'center'
              }
            }
          }}
          ariaLabel="Investment portfolio asset allocation chart"
        />
      </Card>

      {/* Investment Holdings List */}
      <Card 
        title="Holdings" 
        loading={loading} 
        className="holdings-list"
      >
        <div className="holdings-table">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Quantity</th>
                <th>Cost Basis</th>
                <th>Current Price</th>
                <th>Market Value</th>
                <th>Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              {investments.map(investment => {
                const marketValue = investment.quantity * investment.currentPrice;
                const gainLoss = marketValue - (investment.quantity * investment.costBasis);
                
                return (
                  <tr key={investment.id}>
                    <td>{investment.symbol}</td>
                    <td>{investment.quantity.toFixed(4)}</td>
                    <td>{formatCurrency(investment.costBasis)}</td>
                    <td>{formatCurrency(investment.currentPrice)}</td>
                    <td>{formatCurrency(marketValue)}</td>
                    <td className={gainLoss >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(gainLoss)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sync Status */}
      {syncing && (
        <div className="sync-status" role="status" aria-live="polite">
          Synchronizing investment data...
        </div>
      )}

      <style jsx>{`
        .portfolio-container {
          display: grid;
          gap: 1.5rem;
          padding: 1.5rem;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .summary-item label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .summary-item .value {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .positive {
          color: var(--color-success);
        }

        .negative {
          color: var(--color-error);
        }

        .holdings-table {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--color-border);
        }

        th {
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .sync-status {
          position: fixed;
          bottom: 1rem;
          right: 1rem;
          padding: 0.75rem 1rem;
          background-color: var(--color-primary);
          color: white;
          border-radius: 0.5rem;
          box-shadow: var(--shadow-md);
        }

        .error-message {
          color: var(--color-error);
          text-align: center;
          padding: 2rem;
        }

        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .holdings-table {
            font-size: 0.875rem;
          }

          th, td {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Portfolio;