// Foundation version: iOS 14.0+
import Foundation

/// Generic structure for handling and decoding typed API responses with comprehensive validation
/// Addresses requirements:
/// - RESTful Backend API: Implements response handling for RESTful backend API service with type-safe decoding
/// - API Gateway Integration: Handles response parsing and validation from AWS API Gateway
/// - Error Handling Standards: Implements standardized response validation and error handling
@frozen
public struct APIResponse<T: Codable> {
    /// The decoded response data
    public let data: T
    
    /// HTTP status code from the response
    public let statusCode: Int
    
    /// Response headers with case-insensitive access
    public let headers: [String: String]
    
    /// Initializes a new API response with validated data and metadata
    /// - Parameters:
    ///   - data: The decoded response data
    ///   - statusCode: HTTP status code from the response
    ///   - headers: Response headers
    public init(data: T, statusCode: Int, headers: [String: String]) {
        self.data = data
        self.statusCode = statusCode
        // Normalize header keys to be case-insensitive
        self.headers = headers.reduce(into: [:]) { result, pair in
            result[pair.key.lowercased()] = pair.value
        }
    }
    
    /// Decodes HTTP response data into a typed APIResponse with comprehensive validation
    /// - Parameters:
    ///   - data: Raw response data to decode
    ///   - response: HTTP response containing status code and headers
    /// - Returns: Result containing either decoded response or detailed error information
    public static func decode(data: Data, response: HTTPURLResponse) -> Result<APIResponse<T>, APIError> {
        // First validate the HTTP response
        let validationResult = validateResponse(response)
        if case .failure(let error) = validationResult {
            return .failure(error)
        }
        
        // Verify we have data to decode
        guard !data.isEmpty else {
            return .failure(.noData)
        }
        
        // Attempt to decode the response data
        do {
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            decoder.dateDecodingStrategy = .iso8601
            
            let decodedData = try decoder.decode(T.self, from: data)
            let apiResponse = APIResponse(
                data: decodedData,
                statusCode: response.statusCode,
                headers: response.allHeaderFields as? [String: String] ?? [:]
            )
            return .success(apiResponse)
        } catch let error as DecodingError {
            return .failure(.decodingError(error))
        } catch {
            return .failure(.requestFailed(error))
        }
    }
    
    /// Validates HTTP response status code and headers against API Gateway requirements
    /// - Parameter response: HTTP response to validate
    /// - Returns: Success if validation passes, or specific error with context
    private static func validateResponse(_ response: HTTPURLResponse) -> Result<Void, APIError> {
        // Validate status code
        let statusCode = response.statusCode
        guard (200...299).contains(statusCode) else {
            switch statusCode {
            case 401:
                return .failure(.unauthorized)
            case 500...599:
                return .failure(.serverError("Server error with status code: \(statusCode)"))
            default:
                return .failure(.invalidResponse(statusCode))
            }
        }
        
        // Validate Content-Type header
        let headers = response.allHeaderFields as? [String: String] ?? [:]
        let contentType = headers["Content-Type"]?.lowercased() ?? ""
        guard contentType.contains("application/json") else {
            return .failure(.invalidResponse(statusCode))
        }
        
        // Validate response size (optional, adjust limit as needed)
        if let contentLength = headers["Content-Length"],
           let size = Int(contentLength),
           size > 10_000_000 { // 10MB limit
            return .failure(.invalidResponse(statusCode))
        }
        
        return .success(())
    }
}

// MARK: - APIResponse Extension
extension APIResponse {
    /// Checks if the response indicates a successful request based on HTTP standards
    /// - Returns: True if status code is in the success range (200-299)
    public func isSuccess() -> Bool {
        return (200...299).contains(statusCode)
    }
    
    /// Retrieves a specific header value with case-insensitive matching
    /// - Parameter name: Header name to lookup
    /// - Returns: Header value if present, nil otherwise
    public func getHeader(_ name: String) -> String? {
        return headers[name.lowercased()]
    }
}