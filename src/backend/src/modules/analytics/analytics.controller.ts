// Library versions:
// @nestjs/common: ^9.0.0
// @nestjs/swagger: ^9.0.0

/**
 * Human Tasks:
 * 1. Configure rate limiting for analytics endpoints
 * 2. Set up monitoring for analytics endpoint performance
 * 3. Configure caching strategy for analytics responses
 * 4. Review and adjust analytics calculation thresholds
 * 5. Set up alerts for abnormal analytics usage patterns
 */

import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse 
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { 
  AnalyticsQueryDto, 
  AnalyticsTimeframe, 
  AnalyticsType 
} from './dto/analytics-query.dto';
import { Auth } from '../../common/decorators/auth.decorator';

/**
 * Controller implementing REST endpoints for financial analytics and reporting
 * 
 * Requirements addressed:
 * - Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
 *   Provides financial insights through comprehensive data analysis and visualization
 * 
 * - Data Export and Reporting (Technical Specification/1.2 Scope/Core Features)
 *   Implements data export with multiple format support and secure handling
 */
@Controller('analytics')
@ApiTags('Analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Generates analytics report based on query parameters
   */
  @Get()
  @Auth(['user'])
  @ApiOperation({ summary: 'Generate analytics report' })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics report generated successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid query parameters' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async getAnalytics(
    @Query() queryDto: AnalyticsQueryDto,
    @CurrentUser() userId: string
  ): Promise<AnalyticsReport> {
    try {
      // Validate date range
      if (queryDto.startDate && queryDto.endDate) {
        const start = new Date(queryDto.startDate);
        const end = new Date(queryDto.endDate);
        if (start > end) {
          throw new BadRequestException('Start date must be before end date');
        }
      }

      // Validate analytics type
      if (!Object.values(AnalyticsType).includes(queryDto.type)) {
        throw new BadRequestException('Invalid analytics type');
      }

      return await this.analyticsService.generateAnalytics(queryDto, userId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to generate analytics report');
    }
  }

  /**
   * Retrieves spending trends analysis with period comparisons
   */
  @Get('spending-trends')
  @Auth(['user'])
  @ApiOperation({ summary: 'Get spending trends analysis' })
  @ApiResponse({ 
    status: 200, 
    description: 'Spending trends retrieved successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async getSpendingTrends(
    @Query() queryDto: AnalyticsQueryDto,
    @CurrentUser() userId: string
  ): Promise<SpendingTrendsReport> {
    try {
      // Set default timeframe if not provided
      if (!queryDto.timeframe) {
        queryDto.timeframe = AnalyticsTimeframe.MONTHLY;
      }

      // Force analytics type for this endpoint
      queryDto.type = AnalyticsType.SPENDING_TRENDS;

      return await this.analyticsService.getSpendingTrends(queryDto, userId);
    } catch (error) {
      throw new BadRequestException('Failed to retrieve spending trends');
    }
  }

  /**
   * Retrieves budget performance analysis with adherence metrics
   */
  @Get('budget-performance')
  @Auth(['user'])
  @ApiOperation({ summary: 'Get budget performance analysis' })
  @ApiResponse({ 
    status: 200, 
    description: 'Budget performance retrieved successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async getBudgetPerformance(
    @Query() queryDto: AnalyticsQueryDto,
    @CurrentUser() userId: string
  ): Promise<BudgetPerformanceReport> {
    try {
      // Set default timeframe if not provided
      if (!queryDto.timeframe) {
        queryDto.timeframe = AnalyticsTimeframe.MONTHLY;
      }

      // Force analytics type for this endpoint
      queryDto.type = AnalyticsType.BUDGET_PERFORMANCE;

      return await this.analyticsService.getBudgetPerformance(queryDto, userId);
    } catch (error) {
      throw new BadRequestException('Failed to retrieve budget performance');
    }
  }

  /**
   * Exports analytics data in specified format
   */
  @Post('export')
  @Auth(['user'])
  @ApiOperation({ summary: 'Export analytics data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics data exported successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid export format' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async exportAnalytics(
    @Query() queryDto: AnalyticsQueryDto,
    @CurrentUser() userId: string,
    @Body('format') format: string
  ): Promise<ExportedData> {
    try {
      // Validate export format
      const supportedFormats = ['csv', 'json', 'pdf'];
      if (!format || !supportedFormats.includes(format.toLowerCase())) {
        throw new BadRequestException(
          `Invalid export format. Supported formats: ${supportedFormats.join(', ')}`
        );
      }

      return await this.analyticsService.exportAnalytics(
        queryDto,
        userId,
        format.toLowerCase()
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to export analytics data');
    }
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