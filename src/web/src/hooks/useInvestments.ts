// @version react ^18.0.0

import { useState, useCallback, useEffect } from 'react';
import { 
  getInvestments, 
  getInvestmentById, 
  getInvestmentPerformance, 
  syncInvestments 
} from '../services/api/investments.api';
import { Investment, InvestmentPerformanceData } from '../types/models.types';

/**
 * Human Tasks:
 * 1. Configure error monitoring and alerting for investment sync failures
 * 2. Set up performance monitoring for investment data fetching
 * 3. Configure caching strategy for investment data
 * 4. Set up logging for investment performance tracking
 */

// Interface for investment hook state management
interface InvestmentHookState {
  investments: Investment[];
  loading: boolean;
  error: Error | null;
  syncing: boolean;
}

/**
 * Custom hook for managing investment portfolio data and operations
 * Implements:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 * - Investment Data Management (Technical Specification/6.1.1 Core Application Components)
 */
export function useInvestments() {
  // Initialize state for investments array, loading flag, error state, and syncing status
  const [state, setState] = useState<InvestmentHookState>({
    investments: [],
    loading: false,
    error: null,
    syncing: false
  });

  /**
   * Fetches all investment holdings
   * Implements Investment Portfolio Tracking requirement
   */
  const fetchInvestments = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await getInvestments();
      setState(prev => ({
        ...prev,
        investments: response.data,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        loading: false
      }));
    }
  }, []);

  /**
   * Fetches details for a specific investment
   * Implements Investment Data Management requirement
   */
  const fetchInvestmentById = useCallback(async (id: string): Promise<Investment> => {
    if (!id) {
      throw new Error('Investment ID is required');
    }
    
    try {
      const response = await getInvestmentById(id);
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Fetches performance metrics for an investment
   * Implements Investment Portfolio Tracking requirement
   */
  const fetchPerformance = useCallback(async (
    id: string, 
    period: '1d' | '1w' | '1m' | '3m' |  '6m' | '1y' | 'ytd' | 'all'
  ): Promise<InvestmentPerformanceData> => {
    if (!id || !period) {
      throw new Error('Investment ID and period are required');
    }

    try {
      const response = await getInvestmentPerformance(id, period);
      return {
        returnRate: response.returnRate,
        totalValue: response.totalValue,
        gainLoss: response.gainLoss,
        lastUpdated: new Date(response.lastUpdated),
        historicalData: response.historicalData
      };
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Triggers synchronization of investment data
   * Implements Investment Data Management requirement
   */
  const syncInvestmentData = useCallback(async () => {
    setState(prev => ({ ...prev, syncing: true, error: null }));
    try {
      await syncInvestments();
      // Refresh investments after successful sync
      await fetchInvestments();
      setState(prev => ({ ...prev, syncing: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        syncing: false
      }));
    }
  }, [fetchInvestments]);

  // Set up effect for initial data fetch on component mount
  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  // Return state variables and memoized operations
  return {
    investments: state.investments,
    loading: state.loading,
    error: state.error,
    syncing: state.syncing,
    fetchInvestments,
    fetchInvestmentById,
    fetchPerformance,
    syncInvestments: syncInvestmentData
  };
}