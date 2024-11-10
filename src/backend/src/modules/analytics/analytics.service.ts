// Library versions:
// @nestjs/common: ^9.0.0
// @nestjs/typeorm: ^9.0.0
// class-transformer: ^0.5.1
// class-validator: ^0.14.0

/**
 * Human Tasks:
 * 1. Configure database indexes for analytics queries optimization
 * 2. Set up caching strategy for frequently requested analytics
 * 3. Configure data retention policies for analytics data
 * 4. Set up monitoring for analytics performance metrics
 * 5. Review and adjust analytics calculation thresholds based on production usage
 */

import { Injectable } from '@nestjs/common';
import { AnalyticsQueryDto, AnalyticsTimeframe, AnalyticsType } from './dto/analytics-query.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { BudgetsService } from '../budgets/budgets.service';

/**
 * Service implementing comprehensive financial analytics and reporting functionality
 * 
 * Requirements addressed:
 * - Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
 *   Provides financial insights through comprehensive data analysis and visualization
 * 
 * - Data Export and Reporting (Technical Specification/1.2 Scope/Core Features)
 *   Implements data export with multiple format support and secure handling
 */
@Injectable()
export class AnalyticsService {
  // Analytics calculation thresholds
  private readonly TREND_SIGNIFICANCE_THRESHOLD = 0.1; // 10% change for trend significance
  private readonly BUDGET_WARNING_THRESHOLD = 0.8; // 80% of budget for warnings
  private readonly SAVINGS_OPPORTUNITY_THRESHOLD = 0.2; // 20% reduction potential for savings opportunities

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly budgetsService: BudgetsService
  ) {}

  /**
   * Generates comprehensive analytics report based on query parameters
   */
  async generateAnalytics(queryDto: AnalyticsQueryDto, userId: string): Promise<AnalyticsReport> {
    // Validate date range
    const startDate = queryDto.startDate ? new Date(queryDto.startDate) : new Date(0);
    const endDate = queryDto.endDate ? new Date(queryDto.endDate) : new Date();

    // Fetch required data
    const [transactions] = await this.transactionsService.findAll({
      userId,
      accountId: queryDto.accountId,
      category: queryDto.category,
      startDate,
      endDate
    });

    // Process data based on analytics type
    switch (queryDto.type) {
      case AnalyticsType.SPENDING_TRENDS:
        return this.processSpendingTrends(transactions, queryDto.timeframe || AnalyticsTimeframe.MONTHLY);
      case AnalyticsType.BUDGET_PERFORMANCE:
        return this.processBudgetPerformance(transactions, userId, queryDto.timeframe);
      case AnalyticsType.CATEGORY_BREAKDOWN:
        return this.processCategoryBreakdown(transactions);
      default:
        throw new Error('Unsupported analytics type');
    }
  }

  /**
   * Analyzes spending patterns and trends over specified time periods
   */
  async getSpendingTrends(queryDto: AnalyticsQueryDto, userId: string): Promise<SpendingTrendsReport> {
    const [transactions] = await this.transactionsService.findAll({
      userId,
      startDate: new Date(queryDto.startDate),
      endDate: new Date(queryDto.endDate)
    });

    // Group transactions by timeframe
    const groupedTransactions = this.groupTransactionsByTimeframe(
      transactions,
      queryDto.timeframe || AnalyticsTimeframe.MONTHLY
    );

    // Calculate trends
    const trends = this.calculateSpendingTrends(groupedTransactions);

    // Identify significant changes
    const significantChanges = this.identifySignificantChanges(trends);

    return {
      timeframe: queryDto.timeframe || AnalyticsTimeframe.MONTHLY,
      trends,
      significantChanges,
      summary: this.generateTrendsSummary(trends),
      periodComparison: this.calculatePeriodComparison(trends)
    };
  }

  /**
   * Analyzes budget adherence and performance metrics
   */
  async getBudgetPerformance(queryDto: AnalyticsQueryDto, userId: string): Promise<BudgetPerformanceReport> {
    // Fetch budget data
    const budgets = await this.budgetsService.findAll(userId);
    
    // Fetch relevant transactions
    const [transactions] = await this.transactionsService.findAll({
      userId,
      startDate: new Date(queryDto.startDate),
      endDate: new Date(queryDto.endDate)
    });

    // Calculate performance metrics
    const performanceMetrics = await Promise.all(
      budgets.map(async (budget) => {
        const status = await this.budgetsService.checkBudgetStatus(budget.id);
        const categoryTransactions = transactions.filter(t => t.category === budget.category);
        
        return {
          budgetId: budget.id,
          category: budget.category,
          allocated: budget.amount,
          spent: categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
          status: status.status,
          adherenceRate: this.calculateAdherenceRate(budget, categoryTransactions),
          savingsOpportunities: this.identifySavingsOpportunities(categoryTransactions)
        };
      })
    );

    return {
      timeframe: queryDto.timeframe || AnalyticsTimeframe.MONTHLY,
      performanceMetrics,
      overallAdherence: this.calculateOverallAdherence(performanceMetrics),
      recommendations: this.generateBudgetRecommendations(performanceMetrics)
    };
  }

  /**
   * Exports analytics data in specified format with proper formatting
   */
  async exportAnalytics(queryDto: AnalyticsQueryDto, userId: string, format: string): Promise<ExportedData> {
    // Generate analytics report
    const report = await this.generateAnalytics(queryDto, userId);

    // Transform data based on export format
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(report);
      case 'json':
        return this.exportToJSON(report);
      case 'pdf':
        return this.exportToPDF(report);
      default:
        throw new Error('Unsupported export format');
    }
  }

  /**
   * Private helper methods
   */

  private groupTransactionsByTimeframe(transactions: any[], timeframe: AnalyticsTimeframe): any {
    const grouped = new Map();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate);
      const key = this.getTimeframeKey(date, timeframe);
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(transaction);
    });

    return grouped;
  }

  private getTimeframeKey(date: Date, timeframe: AnalyticsTimeframe): string {
    switch (timeframe) {
      case AnalyticsTimeframe.DAILY:
        return date.toISOString().split('T')[0];
      case AnalyticsTimeframe.WEEKLY:
        const week = Math.floor(date.getDate() / 7);
        return `${date.getFullYear()}-W${week}`;
      case AnalyticsTimeframe.MONTHLY:
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
      case AnalyticsTimeframe.QUARTERLY:
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      case AnalyticsTimeframe.YEARLY:
        return date.getFullYear().toString();
      default:
        throw new Error('Invalid timeframe');
    }
  }

  private calculateSpendingTrends(groupedTransactions: Map<string, any[]>): any[] {
    const trends = [];
    
    for (const [period, transactions] of groupedTransactions) {
      const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const categoryBreakdown = this.calculateCategoryBreakdown(transactions);
      
      trends.push({
        period,
        totalSpent,
        categoryBreakdown,
        transactionCount: transactions.length
      });
    }

    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }

  private calculateCategoryBreakdown(transactions: any[]): any {
    const breakdown = {};
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      breakdown[category] = (breakdown[category] || 0) + Math.abs(transaction.amount);
    });

    return breakdown;
  }

  private identifySignificantChanges(trends: any[]): any[] {
    const changes = [];
    
    for (let i = 1; i < trends.length; i++) {
      const current = trends[i];
      const previous = trends[i - 1];
      const change = (current.totalSpent - previous.totalSpent) / previous.totalSpent;
      
      if (Math.abs(change) >= this.TREND_SIGNIFICANCE_THRESHOLD) {
        changes.push({
          period: current.period,
          changePercent: change * 100,
          type: change > 0 ? 'increase' : 'decrease',
          previousAmount: previous.totalSpent,
          currentAmount: current.totalSpent
        });
      }
    }

    return changes;
  }

  private calculateAdherenceRate(budget: any, transactions: any[]): number {
    const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return Math.min(totalSpent / budget.amount, 1);
  }

  private identifySavingsOpportunities(transactions: any[]): any[] {
    const opportunities = [];
    const merchantFrequency = new Map();
    
    // Analyze transaction patterns
    transactions.forEach(transaction => {
      const key = transaction.merchantName || transaction.description;
      if (!merchantFrequency.has(key)) {
        merchantFrequency.set(key, { count: 0, total: 0 });
      }
      const data = merchantFrequency.get(key);
      data.count++;
      data.total += Math.abs(transaction.amount);
    });

    // Identify potential savings
    for (const [merchant, data] of merchantFrequency) {
      const averageAmount = data.total / data.count;
      if (data.count > 2 && averageAmount * this.SAVINGS_OPPORTUNITY_THRESHOLD > 10) {
        opportunities.push({
          merchant,
          frequency: data.count,
          averageAmount,
          potentialSavings: averageAmount * this.SAVINGS_OPPORTUNITY_THRESHOLD
        });
      }
    }

    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  private calculateOverallAdherence(performanceMetrics: any[]): number {
    const adherenceRates = performanceMetrics.map(m => m.adherenceRate);
    return adherenceRates.reduce((sum, rate) => sum + rate, 0) / adherenceRates.length;
  }

  private generateBudgetRecommendations(performanceMetrics: any[]): any[] {
    const recommendations = [];

    performanceMetrics.forEach(metric => {
      if (metric.adherenceRate > this.BUDGET_WARNING_THRESHOLD) {
        recommendations.push({
          category: metric.category,
          type: 'warning',
          message: `Spending in ${metric.category} is approaching budget limit`,
          suggestedAction: 'Review spending patterns and consider adjusting budget'
        });
      }

      if (metric.savingsOpportunities.length > 0) {
        recommendations.push({
          category: metric.category,
          type: 'opportunity',
          message: `Potential savings identified in ${metric.category}`,
          suggestedAction: 'Review recurring expenses for optimization opportunities',
          potentialSavings: metric.savingsOpportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0)
        });
      }
    });

    return recommendations;
  }

  private exportToCSV(report: any): ExportedData {
    // Implement CSV export formatting
    const csvData = this.convertToCSV(report);
    return {
      format: 'csv',
      data: csvData,
      filename: `analytics_export_${new Date().toISOString()}.csv`
    };
  }

  private exportToJSON(report: any): ExportedData {
    // Implement JSON export formatting
    return {
      format: 'json',
      data: JSON.stringify(report, null, 2),
      filename: `analytics_export_${new Date().toISOString()}.json`
    };
  }

  private exportToPDF(report: any): ExportedData {
    // Implement PDF export formatting (placeholder)
    throw new Error('PDF export not implemented');
  }

  private convertToCSV(data: any): string {
    // Implement CSV conversion logic
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  }
}

interface AnalyticsReport {
  timeframe: AnalyticsTimeframe;
  data: any;
  summary: string;
  insights: any[];
}

interface SpendingTrendsReport {
  timeframe: AnalyticsTimeframe;
  trends: any[];
  significantChanges: any[];
  summary: string;
  periodComparison: any;
}

interface BudgetPerformanceReport {
  timeframe: AnalyticsTimeframe;
  performanceMetrics: any[];
  overallAdherence: number;
  recommendations: any[];
}

interface ExportedData {
  format: string;
  data: string;
  filename: string;
}