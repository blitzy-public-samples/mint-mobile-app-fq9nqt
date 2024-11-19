// @version react ^18.0.0
// @version react-router-dom ^6.0.0

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LineChart from '../../components/charts/LineChart';
import { useInvestments } from '../../hooks/useInvestments';
import { Investment, InvestmentPerformanceData } from '../../types/models.types';
import DashboardLayout from '@/layouts/DashboardLayout';

// Human Tasks:
// 1. Configure error monitoring and alerting for investment data fetch failures
// 2. Set up performance monitoring for chart rendering
// 3. Verify real-time price update integration
// 4. Test responsive layout across different screen sizes
// 5. Validate accessibility features and screen reader support

/**
 * Investment details page component
 * Implements:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 * - Investment Data Management (Technical Specification/6.1.1 Core Application Components)
 */

interface InvestmentDetailsProps { }

interface InvestmentDetailsState {
  investment: Investment | null;
  performance: InvestmentPerformanceData | null;
  loading: boolean;
  error: Error | null;
}

const InvestmentDetails: React.FC<InvestmentDetailsProps> = () => {
  // Get investment ID from URL parameters
  const { id } = useParams<{ id: string }>();

  // Initialize state
  const [state, setState] = useState<InvestmentDetailsState>({
    investment: null,
    performance: null,
    loading: true,
    error: null
  });

  // Get investment data management hooks
  const { fetchInvestmentById, fetchPerformance, loading, error } = useInvestments();

  // Fetch investment details and performance data
  useEffect(() => {
    const loadInvestmentData = async () => {
      if (!id) return;

      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Fetch investment details
        const investment = await fetchInvestmentById(id);

        // Fetch performance data for the last year
        const performanceData = await fetchPerformance(id, 'ytd');

        setState(prev => ({
          ...prev,
          investment,
          performance: performanceData,
          loading: false
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error as Error,
          loading: false
        }));
      }
    };

    loadInvestmentData();
  }, [id, fetchInvestmentById, fetchPerformance]);

  // Calculate investment metrics
  const calculateMetrics = () => {
    if (!state.investment) return null;

    const currentValue = state.investment.quantity * state.investment.currentPrice;
    const gainLoss = currentValue - state.investment.costBasis;
    const returnRate = (gainLoss / state.investment.costBasis) * 100;

    return {
      currentValue,
      gainLoss,
      returnRate
    };
  };

  // Render loading state
  if (state.loading) {
    return (
      <DashboardLayout>
        <div className="investment-details-loading" role="alert" aria-busy="true">
          <h2>Loading investment details...</h2>
        </div>
      </DashboardLayout>
    );
  }

  // Render error state
  if (state.error) {
    return (
      <DashboardLayout>
        <div className="investment-details-error" role="alert">
          <h2>Error loading investment details</h2>
          <p>{state.error.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  // Return null if no investment data
  if (!state.investment || !state.performance) {
    return <DashboardLayout/>;
  }

  const metrics = calculateMetrics();
  if (!metrics) return null;

  return (
    <DashboardLayout>
      <div className="investment-details-container">
        {/* Investment Header */}
        <header className="investment-header">
          <h1>{state.investment.symbol}</h1>
          <div className="last-updated">
            Last updated: {new Date(state.investment.lastUpdated).toLocaleString()}
          </div>
        </header>

        {/* Investment Summary */}
        <section className="investment-summary" aria-label="Investment Summary">
          <div className="metric-card">
            <h3>Current Value</h3>
            <p className="value">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(metrics.currentValue)}
            </p>
          </div>

          <div className="metric-card">
            <h3>Gain/Loss</h3>
            <p className={`value ${metrics.gainLoss >= 0 ? 'positive' : 'negative'}`}>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                signDisplay: 'always'
              }).format(metrics.gainLoss)}
            </p>
          </div>

          <div className="metric-card">
            <h3>Return Rate</h3>
            <p className={`value ${metrics.returnRate >= 0 ? 'positive' : 'negative'}`}>
              {metrics.returnRate.toFixed(2)}%
            </p>
          </div>
        </section>

        {/* Investment Details */}
        <section className="investment-details" aria-label="Investment Details">
          <div className="details-grid">
            <div className="detail-item">
              <h3>Quantity</h3>
              <p>{state.investment.quantity.toFixed(4)}</p>
            </div>
            <div className="detail-item">
              <h3>Cost Basis</h3>
              <p>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(state.investment.costBasis)}
              </p>
            </div>
            <div className="detail-item">
              <h3>Current Price</h3>
              <p>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(state.investment.currentPrice)}
              </p>
            </div>
          </div>
        </section>

        {/* Performance Chart */}
        <section className="performance-chart" aria-label="Performance Chart">
          <h2>Performance History</h2>
          <div className="chart-container">
            <LineChart
              data={state.performance.historicalData}
              lineName={state.investment.symbol}
              height={400}
              options={{
                plugins: {
                  title: {
                    display: true,
                    text: 'Investment Performance'
                  },
                  tooltip: {
                    callbacks: {
                      label: (context: any) => {
                        return `Value: ${new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(context.parsed.y)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    title: {
                      display: true,
                      text: 'Value (USD)'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Date'
                    }
                  }
                }
              }}
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default InvestmentDetails;