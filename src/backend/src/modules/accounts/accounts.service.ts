// Third-party imports with versions
import { Injectable } from '@nestjs/common'; // ^9.0.0
import { InjectRepository } from '@nestjs/typeorm'; // ^9.0.0
import { Repository } from 'typeorm'; // ^0.3.0
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';

// Internal imports
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PlaidService } from '../plaid/plaid.service';

/**
 * Human Tasks:
 * 1. Configure database encryption keys in environment variables
 * 2. Set up Plaid API credentials and environment settings
 * 3. Configure audit logging for sensitive operations
 * 4. Set up proper database indexes for query optimization
 * 5. Configure rate limiting for account operations
 */

/**
 * Service responsible for managing financial accounts
 * Requirements addressed:
 * - Financial Account Integration (Technical Specification/1.2 Scope/Core Features)
 *   Implements secure financial institution integration and account aggregation
 * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
 *   Enables tracking and management of financial transactions across accounts
 * - Data Security (Technical Specification/9.2 Data Security)
 *   Implements secure handling of sensitive financial account data with field-level encryption
 */
@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly plaidService: PlaidService
  ) {}

  /**
   * Creates a new financial account with validated data
   * @param createAccountDto Account creation data
   * @param userId Owner's user ID
   * @returns Newly created account
   */
  async create(createAccountDto: CreateAccountDto, userId: string): Promise<Account> {
    try {
      // Create new account entity
      const account = this.accountRepository.create({
        ...createAccountDto,
        userId,
        isActive: true,
        lastSyncedAt: new Date()
      });

      // If Plaid token is provided, validate and fetch initial data
      if (createAccountDto.plaidAccessToken) {
        const plaidData = await this.plaidService.getAccountData(createAccountDto.plaidAccessToken);
        account.plaidAccountId = plaidData.accounts[0]?.account_id;
        account.balance = plaidData.accounts[0]?.balances.current || account.balance;
      }

      // Save account with encrypted sensitive data
      const savedAccount = await this.accountRepository.save(account);

      // Return account without sensitive data
      delete savedAccount.plaidAccessToken;
      return savedAccount;
    } catch (error) {
      throw new BadRequestException(`Failed to create account: ${error.message}`);
    }
  }

  /**
   * Retrieves all accounts for a user with proper authorization
   * @param userId Owner's user ID
   * @returns List of user's accounts with sensitive data excluded
   */
  async findAll(userId: string): Promise<Account[]> {
    try {
      const accounts = await this.accountRepository.find({
        where: { userId, isActive: true },
        order: { createdAt: 'DESC' }
      });

      // Remove sensitive data before returning
      return accounts.map(account => {
        delete account.plaidAccessToken;
        return account;
      });
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve accounts: ${error.message}`);
    }
  }

  /**
   * Retrieves a specific account by ID with proper authorization
   * @param id Account ID
   * @param userId Owner's user ID
   * @returns Account details with sensitive data excluded
   */
  async findOne(id: string, userId: string): Promise<Account> {
    try {
      const account = await this.accountRepository.findOne({
        where: { id, userId }
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      // Remove sensitive data before returning
      delete account.plaidAccessToken;
      return account;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve account: ${error.message}`);
    }
  }

  /**
   * Updates an existing account with validated data
   * @param id Account ID
   * @param updateAccountDto Account update data
   * @param userId Owner's user ID
   * @returns Updated account with sensitive data excluded
   */
  async update(id: string, updateAccountDto: UpdateAccountDto, userId: string): Promise<Account> {
    try {
      const account = await this.findOne(id, userId);

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      // Update account with new data
      Object.assign(account, updateAccountDto);

      // Save updated account with encrypted sensitive data
      const updatedAccount = await this.accountRepository.save(account);

      // Remove sensitive data before returning
      delete updatedAccount.plaidAccessToken;
      return updatedAccount;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update account: ${error.message}`);
    }
  }

  /**
   * Deactivates an account with proper authorization
   * @param id Account ID
   * @param userId Owner's user ID
   */
  async remove(id: string, userId: string): Promise<void> {
    try {
      const account = await this.findOne(id, userId);

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      // Soft delete by marking as inactive
      account.isActive = false;
      await this.accountRepository.save(account);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to remove account: ${error.message}`);
    }
  }

  /**
   * Synchronizes account data with Plaid securely
   * @param id Account ID
   * @param userId Owner's user ID
   * @returns Synchronized account data with sensitive data excluded
   */
  async syncAccount(id: string, userId: string): Promise<Account> {
    try {
      const account = await this.findOne(id, userId);

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      if (!account.plaidAccessToken) {
        throw new BadRequestException('Account not connected to Plaid');
      }

      // Fetch latest data from Plaid
      const plaidData = await this.plaidService.getAccountData(account.plaidAccessToken);

      // Update account with new data
      account.balance = plaidData.accounts[0]?.balances.current || account.balance;
      account.lastSyncedAt = new Date();

      // Save updated account with encrypted sensitive data
      const updatedAccount = await this.accountRepository.save(account);

      // Remove sensitive data before returning
      delete updatedAccount.plaidAccessToken;
      return updatedAccount;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to sync account: ${error.message}`);
    }
  }
}