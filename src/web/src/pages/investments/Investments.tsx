// @version react ^18.0.0

/**
 * Human Tasks:
 * 1. Configure performance monitoring for investment data visualization
 * 2. Set up error tracking for investment sync failures
 * 3. Verify accessibility compliance with screen readers
 * 4. Test responsive layout on various screen sizes
 * 5. Configure analytics tracking for investment interactions
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useInvestments } from '../../hooks/useInvestments';
import DonutChart from '../../components/charts/DonutChart';
import Spinner from '../../components/common/Spinner';
import { Investment } from '@/types/models.types';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';

// Asset allocation color mapping
const ASSET_COLORS = {
  stocks: '#4CAF50',
  bonds: '#2196F3',
  cash: '#FFC107',
  realEstate: '#9C27B0',
  commodities: '#FF5722',
  other: '#607D8B'
};

// Interface for portfolio metrics
interface PortfolioMetrics {
  totalValue: number;
  totalGainLoss: number;
  percentageReturn: number;
  lastUpdated: Date;
}

// Interface for asset allocation data
interface AssetAllocationData {
  label: string;
  value: number;
  color: string;
}

/**
 * Main investments page component that displays portfolio overview and asset allocation
 * Implements:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 * - Investment Data Management (Technical Specification/6.1.1 Core Application Components)
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 */
const Investments: React.FC = () => {
  const navigate = useNavigate();

  // Initialize investment data and operations
  const { investments, loading, error, syncing, fetchInvestments, syncInvestments } = useInvestments();

  // Local state for portfolio metrics
  const [metrics, setMetrics] = useState<PortfolioMetrics>({
    totalValue: 0,
    totalGainLoss: 0,
    percentageReturn: 0,
    lastUpdated: new Date()
  });

  /**
   * Calculate portfolio metrics from investment data
   * Implements Investment Portfolio Tracking requirement
   */
  const calculatePortfolioMetrics = (investments: any[]): PortfolioMetrics => {
    const totalValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
    const totalCost = investments.reduce((sum, inv) => sum + (inv.costBasis || 0), 0);
    const totalGainLoss = totalValue - totalCost;
    const percentageReturn = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalGainLoss,
      percentageReturn,
      lastUpdated: new Date()
    };
  };

  /**
   * Transform investment data into chart-compatible format
   * Implements User Interface Design requirement
   */
  const prepareAssetAllocationData = (investments: Investment[]): AssetAllocationData[] => {
    // Group investments by asset type
    const groupedByType = investments.reduce((acc, inv) => {
      const type = inv.assetType.toLowerCase();
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += inv.currentValue || 0;
      return acc;
    }, {} as Record<string, number>);

    // Calculate total value for percentage calculation
    const total = Object.values(groupedByType).reduce((sum, value) => sum + value, 0);

    // Transform into chart data format
    return Object.entries(groupedByType)
      .map(([type, value]) => ({
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: total > 0 ? (value / total) * 100 : 0,
        color: ASSET_COLORS[type as keyof typeof ASSET_COLORS] || ASSET_COLORS.other
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Memoized asset allocation data
  const assetAllocationData = useMemo(() =>
    prepareAssetAllocationData(investments),
    [investments]
  );

  // Effect for initial data fetch
  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  // Effect for metrics calculation
  useEffect(() => {
    if (investments.length > 0) {
      setMetrics(calculatePortfolioMetrics(investments));
    }
  }, [investments]);

  function handleInvestmentClick(id: string) {
    navigate(`/investments/${id}`);
  }

  // Handle sync button click
  const handleSync = async () => {
    try {
      await syncInvestments();
    } catch (error) {
      console.error('Investment sync failed:', error);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full h-full flex justify-center items-center" role="status">
          <Spinner size="large" color="primary" ariaLabel="Loading investment data" />
        </div>
      </DashboardLayout>
    );
  }

  // Render error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="investments-error" role="alert">
          <h2>Error Loading Investments</h2>
          <p>{error.message}</p>
          <button onClick={fetchInvestments} className="retry-button">
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Portfolio Overview Section */}
        <section className="portfolio-overview" aria-label="Portfolio Overview">
          <div className="portfolio-header">
            <h1 className="text-2xl font-bold mb-6">Investment Portfolio</h1>
            {/* <button
              onClick={handleSync}
              disabled={syncing}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
              aria-label={syncing ? "Syncing investments" : "Sync investments"}
            >
              {syncing ? <Spinner size="small" color="white" /> : 'Sync'}
            </button> */}
          </div>

          <div className="portfolio-metrics space-y-4">
            <div className="metric-card">
              <h3 className="font-medium">Total Value</h3>
              <p className="value">${metrics.totalValue.toLocaleString()}</p>
            </div>
            <div className="metric-card">
              <h3 className="font-medium">Total Gain/Loss</h3>
              <p className={`value ${metrics.totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
                ${Math.abs(metrics.totalGainLoss).toLocaleString()}
                {metrics.totalGainLoss >= 0 ? ' ▲' : ' ▼'}
              </p>
            </div>
            <div className="metric-card">
              <h3 className="font-medium">Return</h3>
              <p className={`value ${metrics.percentageReturn >= 0 ? 'positive' : 'negative'}`}>
                {metrics.percentageReturn.toFixed(2)}%
                {metrics.percentageReturn >= 0 ? ' ▲' : ' ▼'}
              </p>
            </div>
          </div>
        </section>

        {/* Asset Allocation Section */}
        <section className="asset-allocation" aria-label="Asset Allocation">
          <h2 className="font-medium">Asset Allocation</h2>
          <div className="chart-container">
            <DonutChart
              data={assetAllocationData}
              // height={300}
              options={{
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 20,
                      usePointStyle: true
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: (context: any) => {
                        const value = context.raw as number;
                        return `${context.label}: ${value.toFixed(1)}%`;
                      }
                    }
                  }
                }
              }}
              ariaLabel="Asset allocation donut chart"
            />
          </div>
        </section>

        {/* Holdings List Section */}
        <section className="space-y-4" aria-label="Investment Holdings">
          <h2 className="font-medium">Holdings</h2>
          <div className="holdings-table">
            <table>
              <thead>
                <tr>
                  <th scope="col">Asset</th>
                  <th scope="col">Type</th>
                  <th scope="col">Value</th>
                  <th scope="col">Return</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((investment) => (
                  <tr key={investment.id} onClick={() => handleInvestmentClick(investment.id)} style={{ cursor: 'pointer' }}>
                    <td>{investment.symbol}</td>
                    <td>{investment.assetType}</td>
                    <td>${investment.currentValue.toLocaleString()}</td>
                    <td className={investment.return >= 0 ? 'positive' : 'negative'}>
                      {investment.return.toFixed(2)}%
                      {investment.return >= 0 ? ' ▲' : ' ▼'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Last Updated Information */}
        <footer className="investments-footer">
          <p className="last-updated">
            Last updated: {metrics.lastUpdated.toLocaleString()}
          </p>
        </footer>
      </div>
    </DashboardLayout>
  );
};

export default Investments;