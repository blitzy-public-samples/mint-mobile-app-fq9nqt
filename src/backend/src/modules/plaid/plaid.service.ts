// Third-party imports with versions
import { Injectable } from '@nestjs/common'; // ^9.0.0
import { ConfigService } from '@nestjs/config'; // ^2.0.0
import { 
  PlaidApi, 
  Configuration as PlaidConfig, 
  PlaidEnvironments,
  LinkTokenCreateRequest,
  Products,
  CountryCode,
  ItemPublicTokenExchangeRequest,
  AccountsGetRequest,
  TransactionsGetRequest
} from 'plaid'; // ^12.0.0

// Internal imports
import { LinkTokenDto, PlaidProduct, PlaidCountryCode } from './dto/link-token.dto';
import { ExchangeTokenDto } from './dto/exchange-token.dto';

/**
 * Human Tasks:
 * 1. Configure Plaid API credentials in environment variables:
 *    - PLAID_CLIENT_ID
 *    - PLAID_SECRET
 *    - PLAID_ENV (sandbox/development/production)
 * 2. Set up webhook endpoint URL in environment if using webhooks
 * 3. Configure allowed redirect URIs in Plaid dashboard for OAuth flows
 * 4. Set up secure storage for access tokens (encryption at rest)
 */

/**
 * Service responsible for managing Plaid API integration
 * Requirements addressed:
 * - Financial Institution Integration (Technical Specification/1.1 System Overview/Core Components)
 * - Account Aggregation (Technical Specification/1.2 Scope/Core Features)
 * - Data Security (Technical Specification/9.2 Data Security)
 */
@Injectable()
export class PlaidService {
  private readonly plaidClient: PlaidApi;

  constructor(private readonly configService: ConfigService) {
    // Initialize Plaid client with configuration from environment
    const configuration = new PlaidConfig({
      basePath: PlaidEnvironments[this.configService.get<string>('PLAID_ENV', 'sandbox')],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': this.configService.get<string>('PLAID_CLIENT_ID'),
          'PLAID-SECRET': this.configService.get<string>('PLAID_SECRET'),
        },
      },
    });

    this.plaidClient = new PlaidApi(configuration);
  }

  /**
   * Creates a Plaid Link token for account connection
   * @param linkTokenDto Link token creation parameters
   * @returns Generated link token for client initialization
   */
  async createLinkToken(linkTokenDto: LinkTokenDto): Promise<{ linkToken: string }> {
    // Map application products to Plaid products
    const products = linkTokenDto.products.map(product => {
      switch (product) {
        case PlaidProduct.TRANSACTIONS: return Products.Transactions;
        case PlaidProduct.AUTH: return Products.Auth;
        case PlaidProduct.IDENTITY: return Products.Identity;
        case PlaidProduct.INVESTMENTS: return Products.Investments;
        case PlaidProduct.ASSETS: return Products.Assets;
        case PlaidProduct.LIABILITIES: return Products.Liabilities;
      }
    });

    // Map country codes to Plaid format
    const countryCodes = linkTokenDto.countryCodes.map(code => {
      return CountryCode[code];
    });

    // Configure Link token request
    const request: LinkTokenCreateRequest = {
      user: { client_user_id: linkTokenDto.clientUserId },
      client_name: linkTokenDto.clientName,
      products,
      country_codes: countryCodes,
      language: linkTokenDto.language || 'en',
      webhook: linkTokenDto.webhook,
    };

    try {
      const response = await this.plaidClient.linkTokenCreate(request);
      return { linkToken: response.data.link_token };
    } catch (error) {
      throw new Error(`Failed to create link token: ${error.message}`);
    }
  }

  /**
   * Exchanges public token for access token after successful linking
   * @param exchangeTokenDto Token exchange parameters
   * @returns Permanent access credentials
   */
  async exchangePublicToken(exchangeTokenDto: ExchangeTokenDto): Promise<{ accessToken: string; itemId: string }> {
    const request: ItemPublicTokenExchangeRequest = {
      public_token: exchangeTokenDto.publicToken,
    };

    try {
      const response = await this.plaidClient.itemPublicTokenExchange(request);
      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
      };
    } catch (error) {
      throw new Error(`Failed to exchange public token: ${error.message}`);
    }
  }

  /**
   * Retrieves account data using access token
   * @param accessToken Permanent access token for the account
   * @returns Account details and balances
   */
  async getAccountData(accessToken: string): Promise<any> {
    const request: AccountsGetRequest = {
      access_token: accessToken,
    };

    try {
      const response = await this.plaidClient.accountsGet(request);
      return {
        accounts: response.data.accounts,
        item: response.data.item,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve account data: ${error.message}`);
    }
  }

  /**
   * Fetches transactions for specified date range
   * @param accessToken Permanent access token for the account
   * @param startDate Start date for transaction fetch
   * @param endDate End date for transaction fetch
   * @returns Transaction data for specified period
   */
  async getTransactions(
    accessToken: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const request: TransactionsGetRequest = {
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      options: {
        count: 100,
        offset: 0,
      },
    };

    try {
      const transactions = [];
      let hasMore = true;
      
      // Handle pagination for large transaction sets
      while (hasMore) {
        const response = await this.plaidClient.transactionsGet(request);
        transactions.push(...response.data.transactions);
        
        hasMore = response.data.total_transactions > transactions.length;
        request.options.offset = transactions.length;
      }

      return {
        transactions,
        accounts: transactions[0]?.accounts || [],
        item: transactions[0]?.item || null,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve transactions: ${error.message}`);
    }
  }
}