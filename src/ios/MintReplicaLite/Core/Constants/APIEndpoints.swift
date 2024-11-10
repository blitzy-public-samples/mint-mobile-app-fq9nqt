// Foundation version: iOS 14.0+
import Foundation

// MARK: - Human Tasks
/*
1. Ensure the BASE_URL is configured correctly in your environment configuration
2. Update API_VERSION when deploying new API versions
3. Verify SSL certificates are properly configured for HTTPS communication
*/

// MARK: - Global Constants
/// Current API version for endpoint routing
let API_VERSION: String = "v1"

/// Base URL for all API requests
let BASE_URL: String = "https://api.mintreplicalite.com"

/// Current app version from Info.plist
let APP_VERSION: String = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"

// MARK: - API Endpoints Structure
/// Main structure containing all API endpoint configurations
@frozen struct APIEndpoints {
    // MARK: - Properties
    let baseURL: String
    let version: String
    
    // MARK: - Initialization
    init(baseURL: String = BASE_URL, version: String = API_VERSION) {
        self.baseURL = baseURL
        self.version = version
    }
    
    // MARK: - URL Builder
    /// Constructs complete API URL with version and endpoint path
    /// - Parameter endpoint: The specific endpoint path to append
    /// - Returns: Complete URL string for the API request
    func buildURL(endpoint: String) -> String {
        return "\(baseURL)/\(version)\(endpoint)"
    }
}

// MARK: - Authentication Endpoints
/// Authentication related endpoint paths
struct Auth {
    /// Endpoint for user login
    static let login: String = "/auth/login"
    /// Endpoint for user registration
    static let register: String = "/auth/register"
    /// Endpoint for refreshing authentication tokens
    static let refreshToken: String = "/auth/refresh"
}

// MARK: - Account Management Endpoints
/// Account management related endpoint paths
struct Accounts {
    /// Endpoint for retrieving account list
    static let list: String = "/accounts"
    /// Endpoint for retrieving account details
    static let details: String = "/accounts/details"
    /// Endpoint for linking new accounts
    static let link: String = "/accounts/link"
    /// Endpoint for syncing account data
    static let sync: String = "/accounts/sync"
}

// MARK: - Transaction Management Endpoints
/// Transaction related endpoint paths
struct Transactions {
    /// Endpoint for retrieving transaction list
    static let list: String = "/transactions"
    /// Endpoint for retrieving transaction details
    static let details: String = "/transactions/details"
    /// Endpoint for categorizing transactions
    static let categorize: String = "/transactions/categorize"
    /// Endpoint for searching transactions
    static let search: String = "/transactions/search"
}

// MARK: - Budget Management Endpoints
/// Budget management related endpoint paths
struct Budgets {
    /// Endpoint for retrieving budget list
    static let list: String = "/budgets"
    /// Endpoint for creating new budgets
    static let create: String = "/budgets/create"
    /// Endpoint for updating existing budgets
    static let update: String = "/budgets/update"
    /// Endpoint for deleting budgets
    static let delete: String = "/budgets/delete"
}

// MARK: - Financial Goals Endpoints
/// Financial goals related endpoint paths
struct Goals {
    /// Endpoint for retrieving goals list
    static let list: String = "/goals"
    /// Endpoint for creating new goals
    static let create: String = "/goals/create"
    /// Endpoint for updating existing goals
    static let update: String = "/goals/update"
    /// Endpoint for tracking goal progress
    static let progress: String = "/goals/progress"
}

// MARK: - Investment Management Endpoints
/// Investment related endpoint paths
struct Investments {
    /// Endpoint for retrieving investment portfolio
    static let portfolio: String = "/investments/portfolio"
    /// Endpoint for retrieving investment holdings
    static let holdings: String = "/investments/holdings"
    /// Endpoint for retrieving investment performance
    static let performance: String = "/investments/performance"
}

// MARK: - Notification Management Endpoints
/// Notification related endpoint paths
struct Notifications {
    /// Endpoint for registering notification tokens
    static let register: String = "/notifications/register"
    /// Endpoint for managing notification settings
    static let settings: String = "/notifications/settings"
    /// Endpoint for retrieving notification history
    static let history: String = "/notifications/history"
}

// MARK: - Plaid Integration Endpoints
/// Plaid integration related endpoint paths
struct Plaid {
    /// Endpoint for creating Plaid link tokens
    static let createLinkToken: String = "/plaid/create-link-token"
    /// Endpoint for exchanging public tokens
    static let exchangePublicToken: String = "/plaid/exchange-public-token"
}