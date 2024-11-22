// @version react ^18.0.0
// @version react-router-dom ^6.0.0

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LineChart from '../../components/charts/LineChart';
import { useInvestments } from '../../hooks/useInvestments';
import { Investment, InvestmentPerformanceData } from '../../types/models.types';
import DashboardLayout from '@/layouts/DashboardLayout';
import Spinner from '@/components/common/Spinner';

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
    const costBasis = state.investment.costBasis;
    const gainLoss = currentValue - costBasis;
    
    // Calculate return rate
    const returnRate = costBasis > 0 
      ? ((currentValue / costBasis) - 1) * 100  // Changed to use ratio method
      : 0;

    return {
      currentValue,
      gainLoss,
      returnRate: Number(returnRate.toFixed(2))
    };
  };

  // Render loading state
  if (state.loading) {
    return (
      <DashboardLayout>
        <div className="w-full h-full flex justify-center items-center" role="alert" aria-busy="true">
          <Spinner size="large" color="primary" ariaLabel="Loading investment data" />
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
    return <DashboardLayout />;
  }

  const metrics = calculateMetrics();
  if (!metrics) return null;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Investment Header */}
        <header className="investment-header">
          <h1 className="text-2xl font-bold mb-6">{state.investment.symbol}</h1>
          {/* <div className="last-updated font-medium">
            Last updated: {new Date(state.investment.lastUpdated).toLocaleString()}
          </div> */}
        </header>

        {/* Investment Summary */}
        <section className="investment-summary space-y-2" aria-label="Investment Summary">
          <div>
            <h3 className="font-medium">Current Value</h3>
            <p className="value">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(metrics.currentValue)}
            </p>
          </div>

          <div>
            <h3 className="font-medium">Gain/Loss</h3>
            <p className={`value ${metrics.gainLoss >= 0 ? 'positive' : 'negative'}`}>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                signDisplay: 'always'
              }).format(metrics.gainLoss)}
            </p>
          </div>

          <div>
            <h3 className="font-medium">Return Rate</h3>
            <p className={`value ${metrics.returnRate >= 0 ? 'positive' : 'negative'}`}>
              {metrics.returnRate.toFixed(2)}%
            </p>
          </div>
        </section>

        {/* Investment Details */}
        <section className="investment-details space-y-2" aria-label="Investment Details">
          <div className="detail-item">
            <h3 className="font-medium">Quantity</h3>
            <p>{state.investment.quantity.toFixed(4)}</p>
          </div>
          <div className="detail-item">
            <h3 className="font-medium">Cost Basis</h3>
            <p>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(state.investment.costBasis)}
            </p>
          </div>
          <div className="detail-item">
            <h3 className="font-medium">Current Price</h3>
            <p>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(state.investment.currentPrice)}
            </p>
          </div>
        </section>

        {/* Performance Chart */}
        <section className="performance-chart space-y-2" aria-label="Performance Chart">
          <h2 className="font-medium">Performance History</h2>
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