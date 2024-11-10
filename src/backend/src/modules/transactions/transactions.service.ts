// @nestjs/common v9.0.0
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

// @nestjs/typeorm v9.0.0
import { InjectRepository } from '@nestjs/typeorm';

// typeorm v0.3.0
import { Repository, Between, FindOptionsWhere } from 'typeorm';

// class-transformer v0.5.1
import { plainToClass } from 'class-transformer';

// class-validator v0.14.0
import { validateOrReject } from 'class-validator';

import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

/**
 * Human Tasks:
 * 1. Configure database indexes for transaction queries
 * 2. Set up field-level encryption for sensitive transaction data
 * 3. Configure Plaid API credentials in environment
 * 4. Set up ML model for transaction categorization
 * 5. Configure transaction sync schedule in task scheduler
 */

/**
 * Service class implementing secure transaction management business logic
 * 
 * Requirements addressed:
 * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
 *   Implements comprehensive transaction management with validation and security
 * 
 * - Data Synchronization (Technical Specification/1.1 System Overview)
 *   Handles real-time transaction synchronization with financial institutions
 * 
 * - Data Security (Technical Specification/9.2 Data Security)
 *   Implements secure transaction data handling with encryption and validation
 */
@Injectable()
export class TransactionsService {
  // ML model confidence threshold for auto-categorization
  private readonly CATEGORIZATION_CONFIDENCE_THRESHOLD = 0.85;
  
  // Maximum transaction amount allowed
  private readonly MAX_TRANSACTION_AMOUNT = 1000000;

  // Categorization rules for transaction matching
  private readonly categorizationRules: Map<RegExp, string>;

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>
  ) {
    // Initialize categorization rules
    this.categorizationRules = new Map([
      [/\b(walmart|target|costco|safeway|kroger)\b/i, 'Groceries'],
      [/\b(uber|lyft|taxi|transit|subway|bus)\b/i, 'Transportation'],
      [/\b(netflix|hulu|spotify|apple|google play)\b/i, 'Entertainment'],
      [/\b(rent|mortgage|hoa)\b/i, 'Housing'],
      [/\b(restaurant|cafe|starbucks|mcdonalds)\b/i, 'Dining'],
      [/\b(amazon|ebay|bestbuy|nike)\b/i, 'Shopping']
    ]);
  }

  /**
   * Creates a new transaction with validation and security checks
   */
  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    try {
      // Validate DTO
      await validateOrReject(plainToClass(CreateTransactionDto, createTransactionDto));

      // Validate amount is within acceptable range
      if (Math.abs(createTransactionDto.amount) > this.MAX_TRANSACTION_AMOUNT) {
        throw new BadRequestException('Transaction amount exceeds maximum allowed value');
      }

      // Check for duplicate transaction based on metadata
      if (createTransactionDto.metadata?.plaidTransactionId) {
        const existingTransaction = await this.transactionRepository.findOne({
          where: {
            metadata: { plaidTransactionId: createTransactionDto.metadata.plaidTransactionId }
          }
        });
        if (existingTransaction) {
          throw new BadRequestException('Duplicate transaction detected');
        }
      }

      // Create new transaction entity
      const transaction = this.transactionRepository.create({
        ...createTransactionDto,
        // Convert amount to negative for debit transactions
        amount: createTransactionDto.type === 'debit' ? 
          -Math.abs(createTransactionDto.amount) : 
          Math.abs(createTransactionDto.amount),
        // Auto-categorize if category not provided
        category: createTransactionDto.category || 
          await this.categorizeTransaction({
            description: createTransactionDto.description,
            merchantName: createTransactionDto.merchantName
          } as Transaction)
      });

      // Save transaction with encrypted sensitive data
      return await this.transactionRepository.save(transaction);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid transaction data');
    }
  }

  /**
   * Retrieves all transactions with filtering and pagination
   */
  async findAll(
    filters: {
      accountId?: string;
      userId: string;
      category?: string;
      startDate?: Date;
      endDate?: Date;
      minAmount?: number;
      maxAmount?: number;
    },
    pagination: { page?: number; limit?: number; } = {}
  ): Promise<[Transaction[], number]> {
    const where: FindOptionsWhere<Transaction> = { userId: filters.userId };
    
    // Apply filters
    if (filters.accountId) where.accountId = filters.accountId;
    if (filters.category) where.category = filters.category;
    if (filters.startDate || filters.endDate) {
      where.transactionDate = Between(
        filters.startDate || new Date(0),
        filters.endDate || new Date()
      );
    }
    if (filters.minAmount) where.amount = Between(filters.minAmount, Infinity);
    if (filters.maxAmount) where.amount = Between(-Infinity, filters.maxAmount);

    // Apply pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    // Execute query with proper indexes
    return await this.transactionRepository.findAndCount({
      where,
      order: { transactionDate: 'DESC' },
      skip,
      take: limit
    });
  }

  /**
   * Retrieves a single transaction by ID with security checks
   */
  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, userId }
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  /**
   * Updates an existing transaction with validation and security
   */
  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
    userId: string
  ): Promise<Transaction> {
    // Verify transaction exists and user has access
    const transaction = await this.findOne(id, userId);

    try {
      // Validate update DTO
      await validateOrReject(plainToClass(UpdateTransactionDto, updateTransactionDto));

      // Apply updates
      Object.assign(transaction, updateTransactionDto);

      // Re-categorize if description or merchant changed
      if (updateTransactionDto.description || updateTransactionDto.merchantName) {
        transaction.category = await this.categorizeTransaction(transaction);
      }

      // Save updated transaction
      return await this.transactionRepository.save(transaction);
    } catch (error) {
      throw new BadRequestException('Invalid update data');
    }
  }

  /**
   * Deletes a transaction with security checks
   */
  async remove(id: string, userId: string): Promise<void> {
    // Verify transaction exists and user has access
    const transaction = await this.findOne(id, userId);

    // Perform soft delete
    await this.transactionRepository.softDelete(transaction.id);
  }

  /**
   * Automatically categorizes a transaction using ML and rules
   */
  async categorizeTransaction(transaction: Transaction): Promise<string> {
    const textToMatch = `${transaction.description} ${transaction.merchantName || ''}`.toLowerCase();

    // Try ML categorization first (placeholder for ML service integration)
    try {
      const mlCategory = await this.applyMLCategorization(textToMatch);
      if (mlCategory && mlCategory.confidence > this.CATEGORIZATION_CONFIDENCE_THRESHOLD) {
        return mlCategory.category;
      }
    } catch (error) {
      // Fall back to rule-based categorization on ML failure
      console.error('ML categorization failed:', error);
    }

    // Apply rule-based categorization
    for (const [pattern, category] of this.categorizationRules) {
      if (pattern.test(textToMatch)) {
        return category;
      }
    }

    // Default category if no rules match
    return 'Uncategorized';
  }

  /**
   * Synchronizes transactions with external financial providers
   */
  async syncTransactions(accountId: string, userId: string): Promise<Transaction[]> {
    try {
      // Get latest sync timestamp
      const lastSync = await this.getLastSyncTimestamp(accountId);

      // Fetch new transactions from provider (placeholder for Plaid integration)
      const newTransactions = await this.fetchTransactionsFromProvider(
        accountId,
        lastSync
      );

      // Process and save new transactions
      const savedTransactions = await Promise.all(
        newTransactions.map(async (transactionData) => {
          try {
            return await this.create({
              ...transactionData,
              userId,
              accountId
            });
          } catch (error) {
            // Log error but continue processing other transactions
            console.error('Failed to save transaction:', error);
            return null;
          }
        })
      );

      // Update sync metadata
      await this.updateSyncMetadata(accountId);

      // Return successfully saved transactions
      return savedTransactions.filter(Boolean);
    } catch (error) {
      throw new BadRequestException('Transaction sync failed');
    }
  }

  /**
   * Private helper methods
   */

  private async applyMLCategorization(text: string): Promise<{ category: string; confidence: number; }> {
    // Placeholder for ML service integration
    return { category: 'Uncategorized', confidence: 0 };
  }

  private async getLastSyncTimestamp(accountId: string): Promise<Date> {
    const lastTransaction = await this.transactionRepository.findOne({
      where: { accountId },
      order: { transactionDate: 'DESC' }
    });
    return lastTransaction?.transactionDate || new Date(0);
  }

  private async fetchTransactionsFromProvider(
    accountId: string,
    since: Date
  ): Promise<Partial<CreateTransactionDto>[]> {
    // Placeholder for Plaid integration
    return [];
  }

  private async updateSyncMetadata(accountId: string): Promise<void> {
    // Placeholder for sync metadata update
  }
}