// Third-party imports
import SwiftUI     // Version: iOS 14.0+
import Foundation  // Version: iOS 14.0+

// MARK: - Human Tasks
/*
 1. Ensure iOS deployment target is set to iOS 14.0 or higher in Xcode project settings
 2. Verify SwiftUI navigation features are enabled in project capabilities
*/

// MARK: - Navigation Destinations
/// Defines all possible navigation destinations in the app
/// Requirement: Mobile Navigation Structure (8.1.1)
enum NavigationDestination: Hashable, Codable {
    case dashboard
    case accounts
    case accountDetail(id: UUID)
    case budgets
    case budgetDetail(id: UUID)
    case goals
    case goalDetail(id: UUID)
    case investments
    case investmentDetail(id: UUID)
    case settings
    case profile
    case security
}

// MARK: - Navigation Path Manager
/// Manages navigation state and routing for the application
/// Requirements:
/// - Native mobile applications (1.1)
/// - Mobile Navigation Structure (8.1.1)
@MainActor
final class NavigationPathManager: ObservableObject {
    
    // MARK: - Properties
    
    /// Current navigation path stack
    @Published private(set) var path = NavigationPath()
    
    /// Currently active destination
    @Published private(set) var currentDestination: NavigationDestination?
    
    // MARK: - Initialization
    
    init() {
        self.path = NavigationPath()
        self.currentDestination = nil
    }
    
    // MARK: - Navigation Methods
    
    /// Navigates to a specified destination
    /// - Parameter destination: The destination to navigate to
    func navigate(to destination: NavigationDestination) {
        currentDestination = destination
        path.append(destination)
    }
    
    /// Clears navigation stack and returns to root
    func popToRoot() {
        path.removeLast(path.count)
        currentDestination = nil
    }
    
    /// Navigates back one level in the navigation stack
    func goBack() {
        guard !path.isEmpty else { return }
        path.removeLast()
        
        // Update current destination to the new top of stack
        if let lastDestination = path.count > 0 ? path._elements.last as? NavigationDestination : nil {
            currentDestination = lastDestination
        } else {
            currentDestination = nil
        }
    }
}