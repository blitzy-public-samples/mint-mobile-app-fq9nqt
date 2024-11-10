// Third-party imports
import SwiftUI     // Version: iOS 14.0+
import Foundation  // Version: iOS 14.0+

// MARK: - Human Tasks
/*
 1. Ensure iOS deployment target is set to iOS 14.0 or higher in Xcode project settings
 2. Configure deep linking URL scheme in Info.plist
 3. Verify SwiftUI navigation features are enabled in project capabilities
*/

// MARK: - Navigation Error
/// Defines possible navigation errors
enum NavigationError: Error {
    case invalidDeepLink
    case authenticationRequired
    case invalidDestination
}

// MARK: - App Router
/// Main navigation router managing app navigation flow with type-safe routing and deep link support
/// Requirements:
/// - Native mobile applications (1.1)
/// - Mobile Navigation Structure (8.1.1)
/// - User Interface Design (8.1.2)
@MainActor
final class AppRouter: ObservableObject {
    
    // MARK: - Properties
    
    /// Navigation manager instance for handling navigation state
    let navigationManager: NavigationPathManager
    
    /// Authentication state of the user
    @Published var isAuthenticated: Bool
    
    // MARK: - Constants
    
    private enum Constants {
        static let deepLinkScheme = "mintreplica"
        static let authenticatedRoutes: Set<NavigationDestination> = [
            .accountDetail(id: UUID()),
            .budgetDetail(id: UUID()),
            .goalDetail(id: UUID()),
            .investmentDetail(id: UUID()),
            .profile,
            .security
        ]
    }
    
    // MARK: - Initialization
    
    init() {
        self.navigationManager = NavigationPathManager()
        self.isAuthenticated = false
        setupDeepLinkHandling()
    }
    
    // MARK: - Deep Link Handling
    
    /// Sets up deep link URL handling
    private func setupDeepLinkHandling() {
        NotificationCenter.default.addObserver(
            forName: UIApplication.didFinishLaunchingNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self = self else { return }
            if let url = UserDefaults.standard.url(forKey: "pendingDeepLink") {
                _ = self.handleDeepLink(url: url)
                UserDefaults.standard.removeObject(forKey: "pendingDeepLink")
            }
        }
    }
    
    /// Handles incoming deep links and updates navigation
    /// - Parameter url: The deep link URL to handle
    /// - Returns: Success status of deep link handling
    func handleDeepLink(url: URL) -> Bool {
        guard url.scheme == Constants.deepLinkScheme else {
            return false
        }
        
        let pathComponents = url.pathComponents.filter { $0 != "/" }
        guard !pathComponents.isEmpty else {
            return false
        }
        
        do {
            let destination = try parseDeepLinkDestination(pathComponents)
            if requiresAuthentication(destination) && !isAuthenticated {
                throw NavigationError.authenticationRequired
            }
            
            navigateToScreen(destination)
            return true
        } catch {
            print("Deep link handling failed: \(error)")
            return false
        }
    }
    
    /// Parses deep link path components into a navigation destination
    /// - Parameter components: URL path components
    /// - Returns: Corresponding NavigationDestination
    private func parseDeepLinkDestination(_ components: [String]) throws -> NavigationDestination {
        let base = components[0]
        
        switch base {
        case "dashboard":
            return .dashboard
        case "accounts":
            if components.count > 1, let idString = components[safe: 1],
               let id = UUID(uuidString: idString) {
                return .accountDetail(id: id)
            }
            return .accounts
        case "budgets":
            if components.count > 1, let idString = components[safe: 1],
               let id = UUID(uuidString: idString) {
                return .budgetDetail(id: id)
            }
            return .budgets
        case "goals":
            if components.count > 1, let idString = components[safe: 1],
               let id = UUID(uuidString: idString) {
                return .goalDetail(id: id)
            }
            return .goals
        case "investments":
            if components.count > 1, let idString = components[safe: 1],
               let id = UUID(uuidString: idString) {
                return .investmentDetail(id: id)
            }
            return .investments
        case "settings":
            return .settings
        case "profile":
            return .profile
        case "security":
            return .security
        default:
            throw NavigationError.invalidDeepLink
        }
    }
    
    // MARK: - Navigation
    
    /// Navigates to specified screen with type safety
    /// - Parameter destination: The destination to navigate to
    func navigateToScreen(_ destination: NavigationDestination) {
        if requiresAuthentication(destination) && !isAuthenticated {
            // Handle unauthenticated access attempt
            navigationManager.navigate(to: .dashboard)
            return
        }
        
        withAnimation(.easeInOut) {
            navigationManager.navigate(to: destination)
        }
    }
    
    /// Returns navigation to root screen
    func popToRoot() {
        withAnimation(.easeInOut) {
            navigationManager.popToRoot()
        }
    }
    
    // MARK: - Helper Methods
    
    /// Checks if a destination requires authentication
    /// - Parameter destination: The destination to check
    /// - Returns: Whether authentication is required
    private func requiresAuthentication(_ destination: NavigationDestination) -> Bool {
        switch destination {
        case .accountDetail, .budgetDetail, .goalDetail,
             .investmentDetail, .profile, .security:
            return true
        default:
            return false
        }
    }
}

// MARK: - Array Extension
private extension Array {
    /// Safe array subscript access
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}