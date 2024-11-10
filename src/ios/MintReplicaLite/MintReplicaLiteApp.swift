// Third-party imports
import SwiftUI     // Version: iOS 14.0+
import Foundation  // Version: iOS 14.0+

// MARK: - Human Tasks
/*
 1. Ensure iOS deployment target is set to iOS 14.0 or higher in Xcode project settings
 2. Configure deep linking URL scheme in Info.plist
 3. Set up background app refresh capability for network monitoring
 4. Configure appearance settings in project configuration
 5. Test app lifecycle with different network conditions
*/

/// Main entry point for the Mint Replica Lite iOS application
/// Requirements addressed:
/// - Native mobile applications (1.1 System Overview/Core Features)
/// - Mobile-first personal financial management (1.1 System Overview)
/// - Real-time notification system (1.1 System Overview)
/// - Mobile Navigation Structure (8.1.1 Mobile Navigation Structure)
@main
struct MintReplicaLiteApp: App {
    // MARK: - Properties
    
    /// Router for centralized navigation management
    @StateObject private var router = AppRouter()
    
    /// Network monitor for connectivity tracking
    @StateObject private var networkMonitor = NetworkMonitor.shared
    
    // MARK: - Constants
    
    private enum Constants {
        static let navigationBarForeground = Color("NavigationBarForeground")
        static let navigationBarBackground = Color("NavigationBarBackground")
        static let tabBarTint = Color("TabBarTint")
        static let listBackground = Color("ListBackground")
        static let defaultFontSize: CGFloat = 17
    }
    
    // MARK: - Body
    
    var body: some Scene {
        WindowGroup {
            Group {
                if router.isAuthenticated {
                    // Main app content with navigation
                    DashboardView()
                        .environmentObject(router)
                        .environmentObject(networkMonitor)
                        .onAppear {
                            networkMonitor.startMonitoring()
                        }
                        .onChange(of: networkMonitor.isConnected) { connected in
                            if connected {
                                // Trigger data refresh when connection is restored
                                NotificationCenter.default.post(
                                    name: NSNotification.Name("RefreshData"),
                                    object: nil
                                )
                            }
                        }
                } else {
                    // Authentication flow
                    LoginView()
                        .environmentObject(router)
                }
            }
            .onAppear {
                configureAppearance()
            }
            .onOpenURL { url in
                // Handle deep links through router
                router.handleDeepLink(url: url)
            }
        }
    }
    
    // MARK: - Configuration
    
    /// Configures global app appearance settings
    /// Requirements addressed:
    /// - User Interface Design (8.1.2)
    private func configureAppearance() {
        // Configure navigation bar appearance
        let navigationBarAppearance = UINavigationBarAppearance()
        navigationBarAppearance.configureWithOpaqueBackground()
        navigationBarAppearance.backgroundColor = UIColor(Constants.navigationBarBackground)
        navigationBarAppearance.titleTextAttributes = [
            .foregroundColor: UIColor(Constants.navigationBarForeground),
            .font: UIFont.systemFont(ofSize: Constants.defaultFontSize, weight: .semibold)
        ]
        
        UINavigationBar.appearance().standardAppearance = navigationBarAppearance
        UINavigationBar.appearance().compactAppearance = navigationBarAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navigationBarAppearance
        
        // Configure tab bar appearance
        let tabBarAppearance = UITabBarAppearance()
        tabBarAppearance.configureWithOpaqueBackground()
        tabBarAppearance.backgroundColor = UIColor(Constants.navigationBarBackground)
        
        UITabBar.appearance().standardAppearance = tabBarAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
        UITabBar.appearance().tintColor = UIColor(Constants.tabBarTint)
        
        // Configure list appearance
        UITableView.appearance().backgroundColor = UIColor(Constants.listBackground)
        
        // Configure global tint color
        UIView.appearance().tintColor = UIColor(Constants.tabBarTint)
    }
}

// MARK: - Preview Provider

#if DEBUG
struct MintReplicaLiteApp_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Light mode preview
            DashboardView()
                .environmentObject(AppRouter())
                .environmentObject(NetworkMonitor.shared)
            
            // Dark mode preview
            DashboardView()
                .environmentObject(AppRouter())
                .environmentObject(NetworkMonitor.shared)
                .preferredColorScheme(.dark)
        }
    }
}
#endif