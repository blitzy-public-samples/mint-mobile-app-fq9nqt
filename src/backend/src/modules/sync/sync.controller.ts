// Third-party library versions:
// @nestjs/common: ^9.0.0
// @nestjs/swagger: ^6.0.0

import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Logger 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse 
} from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { SyncRequestDto } from './dto/sync-request.dto';
import Auth from '../../common/decorators/auth.decorator';

/**
 * Human Tasks:
 * 1. Configure rate limiting for sync endpoints
 * 2. Set up monitoring for sync failures and performance
 * 3. Configure backup procedures for sync data
 * 4. Set up alerts for sync conflicts
 * 5. Configure client version compatibility checks
 */

/**
 * Controller handling data synchronization endpoints with offline-first support
 * and secure data transmission using AES-256-GCM encryption
 * 
 * Requirements addressed:
 * - Real-time Data Synchronization (Technical Specification/1.1 System Overview/Core Components)
 * - Offline Support (Technical Specification/5.2.1 Mobile Applications)
 * - Data Security (Technical Specification/9.2 Data Security)
 */
@Controller('sync')
@ApiTags('sync')
export class SyncController {
  private readonly logger: Logger;

  constructor(private readonly syncService: SyncService) {
    this.logger = new Logger(SyncController.name);
  }

  /**
   * Endpoint for handling data synchronization requests with conflict resolution
   * 
   * Requirements addressed:
   * - Real-time Data Synchronization: Implements real-time sync between mobile clients and backend
   * - Offline Support: Enables offline-first functionality with data synchronization
   * - Data Security: Ensures secure data transmission using AES-256-GCM encryption
   */
  @Post()
  @Auth()
  @ApiOperation({ 
    summary: 'Synchronize data between client and server',
    description: 'Handles bidirectional sync with conflict resolution and encryption'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Data synchronized successfully',
    type: Object // Would define proper response type in production
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing authentication token' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid sync request - Malformed data or validation failure' 
  })
  async synchronize(@Body() syncRequest: SyncRequestDto) {
    this.logger.log(`Sync request received from device ${syncRequest.deviceId} for entity type ${syncRequest.entityType}`);

    try {
      // Call sync service to handle the request with conflict resolution
      const syncResponse = await this.syncService.synchronize(syncRequest);

      this.logger.log(`Sync completed successfully for device ${syncRequest.deviceId}`);
      return syncResponse;

    } catch (error) {
      this.logger.error(`Sync failed for device ${syncRequest.deviceId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Endpoint for synchronizing financial institution data through Plaid API
   * 
   * Requirements addressed:
   * - Real-time Data Synchronization: Syncs financial data in real-time
   * - Data Security: Ensures secure transmission of sensitive financial data
   */
  @Post('financial')
  @Auth()
  @ApiOperation({ 
    summary: 'Synchronize financial institution data',
    description: 'Syncs account and transaction data from financial institutions via Plaid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Financial data synchronized successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing authentication token' 
  })
  async syncFinancialData(
    @Body('userId') userId: string,
    @Body('accountId') accountId: string
  ) {
    this.logger.log(`Financial sync request received for user ${userId}, account ${accountId}`);

    try {
      // Call sync service to handle financial data synchronization
      await this.syncService.syncFinancialData(userId, accountId);

      this.logger.log(`Financial sync completed successfully for user ${userId}`);
      return { success: true, message: 'Financial data synchronized successfully' };

    } catch (error) {
      this.logger.error(`Financial sync failed for user ${userId}: ${error.message}`);
      throw error;
    }
  }
}