// Foundation version: iOS 14.0+
import Foundation

/// Comprehensive error type system for handling network and API-related errors
/// Addresses requirements:
/// - A.1.3 Error Handling Standards: Standardized error handling with proper error mapping
/// - 5.2.2 API Gateway: Handles API Gateway specific error cases
/// - 5.2.1 Mobile Applications: Native iOS error handling implementation
@frozen
public enum APIError: Error, LocalizedError {
    /// Invalid URL format or components in the request
    case invalidURL(String)
    
    /// Network request failed with underlying system error
    case requestFailed(Error)
    
    /// Server returned invalid or unexpected HTTP status code
    case invalidResponse(Int)
    
    /// Failed to decode JSON response data into expected model
    case decodingError(DecodingError)
    
    /// Server returned empty response when data was expected
    case noData
    
    /// Authentication required or access token expired
    case unauthorized
    
    /// Server-side error occurred with specific error message
    case serverError(String)
    
    /// No internet connection available or network is unreachable
    case networkConnectivity
    
    /// Request exceeded configured timeout interval
    case timeout
}

// MARK: - LocalizedError Implementation
extension APIError {
    public var errorDescription: String? {
        switch self {
        case .invalidURL(let url):
            return "Invalid URL format: \(url)"
        case .requestFailed(let error):
            return "Network request failed: \(error.localizedDescription)"
        case .invalidResponse(let statusCode):
            return "Server returned unexpected status code: \(statusCode)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .noData:
            return "Server returned empty response"
        case .unauthorized:
            return "Authentication required. Please log in again."
        case .serverError(let message):
            return "Server error: \(message)"
        case .networkConnectivity:
            return "No internet connection. Please check your network settings."
        case .timeout:
            return "Request timed out. Please try again."
        }
    }
    
    public var failureReason: String? {
        switch self {
        case .invalidURL:
            return "The URL provided for the request was malformed or invalid."
        case .requestFailed:
            return "The network request could not be completed due to a system error."
        case .invalidResponse:
            return "The server response did not match the expected format."
        case .decodingError:
            return "The response data could not be parsed into the expected format."
        case .noData:
            return "The server response contained no data when data was expected."
        case .unauthorized:
            return "The request requires valid authentication credentials."
        case .serverError:
            return "An error occurred on the server while processing the request."
        case .networkConnectivity:
            return "The device is not connected to the internet."
        case .timeout:
            return "The request took too long to complete and was cancelled."
        }
    }
    
    public var recoverySuggestion: String? {
        switch self {
        case .invalidURL:
            return "Please verify the request URL is correct and try again."
        case .requestFailed:
            return "Please try the request again. If the problem persists, contact support."
        case .invalidResponse:
            return "Please try again later. If the problem persists, update the app."
        case .decodingError:
            return "Please ensure you have the latest version of the app installed."
        case .noData:
            return "Please try refreshing the data."
        case .unauthorized:
            return "Please sign in again to continue."
        case .serverError:
            return "Please try again later. If the problem persists, contact support."
        case .networkConnectivity:
            return "Please check your internet connection and try again."
        case .timeout:
            return "Please check your internet connection and try again."
        }
    }
    
    /// Returns user-friendly error message for display
    public var localizedDescription: String {
        return errorDescription ?? "An unknown error occurred."
    }
    
    /// Maps URLError and other network errors to appropriate APIError case
    /// - Parameter error: The original error to be mapped
    /// - Returns: Mapped APIError maintaining error context
    public static func handleNetworkError(_ error: Error) -> APIError {
        switch error {
        case let urlError as URLError:
            switch urlError.code {
            case .notConnectedToInternet, .networkConnectionLost:
                return .networkConnectivity
            case .timedOut:
                return .timeout
            case .badURL, .unsupportedURL:
                return .invalidURL(urlError.failureURLString ?? "Unknown URL")
            default:
                return .requestFailed(urlError)
            }
        case let decodingError as DecodingError:
            return .decodingError(decodingError)
        case let apiError as APIError:
            return apiError
        default:
            return .requestFailed(error)
        }
    }
}