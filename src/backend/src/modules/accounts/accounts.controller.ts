// Third-party imports with versions
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  Request,
  UseGuards,
  BadRequestException,
  NotFoundException
} from '@nestjs/common'; // ^9.0.0
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth 
} from '@nestjs/swagger'; // ^6.0.0

// Internal imports
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import Auth from '../../common/decorators/auth.decorator';

/**
 * Human Tasks:
 * 1. Configure rate limiting for account endpoints
 * 2. Set up monitoring for account operations
 * 3. Configure audit logging for sensitive operations
 * 4. Set up alerts for suspicious account activities
 * 5. Configure Plaid API credentials and environment
 */

/**
 * Controller handling HTTP endpoints for secure account management
 * 
 * Requirements addressed:
 * - Financial Account Integration (Technical Specification/1.2 Scope/Core Features)
 *   Implements REST endpoints for financial institution integration
 * - Account Management (Technical Specification/1.2 Scope/Core Features)
 *   Provides API endpoints for account CRUD operations
 * - API Security (Technical Specification/9.3.1 API Security)
 *   Implements secure endpoints with authentication and validation
 */
@Controller('accounts')
@ApiTags('accounts')
@ApiBearerAuth()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  /**
   * Creates a new financial account with validated data and Plaid integration
   */
  @Post()
  @Auth(['user'])
  @ApiOperation({ summary: 'Create new financial account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createAccountDto: CreateAccountDto,
    @Request() req
  ) {
    try {
      const userId = req.user.id;
      return await this.accountsService.create(createAccountDto, userId);
    } catch (error) {
      throw new BadRequestException(`Failed to create account: ${error.message}`);
    }
  }

  /**
   * Retrieves all accounts for authenticated user with proper authorization
   */
  @Get()
  @Auth(['user'])
  @ApiOperation({ summary: 'Get all user accounts' })
  @ApiResponse({ status: 200, description: 'List of accounts retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Request() req) {
    try {
      const userId = req.user.id;
      return await this.accountsService.findAll(userId);
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve accounts: ${error.message}`);
    }
  }

  /**
   * Retrieves a specific account by ID with proper authorization
   */
  @Get(':id')
  @Auth(['user'])
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({ status: 200, description: 'Account details retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findOne(
    @Param('id') id: string,
    @Request() req
  ) {
    try {
      const userId = req.user.id;
      const account = await this.accountsService.findOne(id, userId);
      
      if (!account) {
        throw new NotFoundException('Account not found');
      }
      
      return account;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve account: ${error.message}`);
    }
  }

  /**
   * Updates an existing account with validated data and proper authorization
   */
  @Put(':id')
  @Auth(['user'])
  @ApiOperation({ summary: 'Update account details' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @Request() req
  ) {
    try {
      const userId = req.user.id;
      const account = await this.accountsService.update(id, updateAccountDto, userId);
      
      if (!account) {
        throw new NotFoundException('Account not found');
      }
      
      return account;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update account: ${error.message}`);
    }
  }

  /**
   * Deactivates an account with proper authorization
   */
  @Delete(':id')
  @Auth(['user'])
  @ApiOperation({ summary: 'Deactivate account' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async remove(
    @Param('id') id: string,
    @Request() req
  ) {
    try {
      const userId = req.user.id;
      await this.accountsService.remove(id, userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to remove account: ${error.message}`);
    }
  }

  /**
   * Synchronizes account data with financial institution through Plaid
   */
  @Post(':id/sync')
  @Auth(['user'])
  @ApiOperation({ summary: 'Sync account with financial institution' })
  @ApiResponse({ status: 200, description: 'Account synchronized successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async syncAccount(
    @Param('id') id: string,
    @Request() req
  ) {
    try {
      const userId = req.user.id;
      return await this.accountsService.syncAccount(id, userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to sync account: ${error.message}`);
    }
  }
}