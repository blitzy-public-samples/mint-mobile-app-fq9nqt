// iOS 15.0+ Required
import Foundation  // Version: iOS 15.0+
import Combine    // Version: iOS 15.0+

/// ViewModelState enum defining possible states for view models
/// Used across the application to maintain consistent state management
enum ViewModelState {
    case idle
    case loading
    case error
    case success
}

/// Base protocol that all ViewModels in the application must conform to
/// Establishes a consistent interface for state management and error handling
/// Ensures thread-safe UI updates through @MainActor
///
/// Requirements addressed:
/// - Mobile Applications (5.2.1): Native iOS application using Swift and SwiftUI with shared business logic layer
/// - System Components (6.1.1): Core application components and manager implementations
@MainActor
protocol ViewModelProtocol {
    /// Published property to track the current state of the view model
    /// Enables reactive UI updates based on state changes
    var state: Published<ViewModelState>.Publisher { get }
    
    /// Published property to store and communicate error messages
    /// Optional string that contains user-friendly error messages when state is .error
    var errorMessage: Published<String?>.Publisher { get }
    
    /// Required initialization method that sets up the view model
    /// Must be called after view model instantiation to properly initialize state and subscriptions
    func initialize()
    
    /// Standard error handling method for consistent error management
    /// - Parameter error: The error that needs to be handled
    func handleError(_ error: Error)
}

// MARK: - Default Implementation
@MainActor
extension ViewModelProtocol {
    /// Default implementation of handleError to provide consistent error handling across view models
    func handleError(_ error: Error) {
        // Set state to error to trigger UI updates
        if let publishedState = self as? any Publisher<ViewModelState, Never> {
            publishedState.send(.error)
        }
        
        // Set error message from the provided error
        if let publishedError = self as? any Publisher<String?, Never> {
            publishedError.send(error.localizedDescription)
        }
        
        #if DEBUG
        // Additional debug logging in development builds
        print("ViewModel Error: \(error.localizedDescription)")
        #endif
    }
}

/* Human Tasks Required:
1. Ensure Xcode deployment target is set to iOS 15.0 or higher
2. Add appropriate error tracking/logging service integration
3. Configure SwiftUI previews to handle @MainActor properly
4. Review error messages for localization requirements
*/