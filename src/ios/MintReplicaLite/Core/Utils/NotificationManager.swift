// UserNotifications version: iOS 14.0+
import UserNotifications
// Foundation version: iOS 14.0+
import Foundation

// MARK: - Human Tasks
/*
1. Configure notification categories and actions in Info.plist
2. Set up APNS certificates and keys in Apple Developer Portal
3. Configure notification sound files in app bundle
4. Update notification presentation options based on UX requirements
*/

/// NotificationManager handles all local and push notification operations for the iOS application
/// Addresses requirements:
/// - Real-time notification system (1.1 System Overview)
/// - Push notification services (5.2.3 Service Layer Architecture)
/// - Mobile Applications (5.2.1 Mobile Applications)
@MainActor
final class NotificationManager: NSObject {
    
    // MARK: - Properties
    
    /// Shared singleton instance
    static let shared = NotificationManager()
    
    /// User notification center instance
    private let center: UNUserNotificationCenter
    
    /// Flag indicating if the app is registered for remote notifications
    private(set) var isRegisteredForRemoteNotifications: Bool = false
    
    /// Flag indicating if the app has notification permission
    private(set) var hasNotificationPermission: Bool = false
    
    // MARK: - Initialization
    
    private override init() {
        self.center = UNUserNotificationCenter.current()
        super.init()
        self.center.delegate = self
        
        // Check current notification settings
        Task {
            await updateNotificationPermissionStatus()
        }
    }
    
    // MARK: - Public Methods
    
    /// Requests authorization for notifications from the user
    /// - Parameter completion: Closure called with authorization result and potential error
    func requestAuthorization(completion: @escaping (Bool, Error?) -> Void) {
        let options: UNAuthorizationOptions = [.alert, .sound, .badge]
        
        center.requestAuthorization(options: options) { [weak self] granted, error in
            DispatchQueue.main.async {
                self?.hasNotificationPermission = granted
                self?.isRegisteredForRemoteNotifications = granted
                completion(granted, error)
            }
        }
    }
    
    /// Schedules a local notification
    /// - Parameters:
    ///   - title: Notification title
    ///   - body: Notification body text
    ///   - date: Date when notification should be delivered
    ///   - userInfo: Optional additional data for the notification
    func scheduleLocalNotification(
        title: String,
        body: String,
        date: Date,
        userInfo: [String: Any]? = nil
    ) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        if let userInfo = userInfo {
            content.userInfo = userInfo
        }
        
        // Add app name to notification for branding
        content.subtitle = AppConstants.APP_NAME
        
        // Create trigger based on date
        let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        
        // Create unique identifier for the notification
        let identifier = UUID().uuidString
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        
        center.add(request) { error in
            if let error = error {
                print("Error scheduling notification: \(error.localizedDescription)")
            }
        }
    }
    
    /// Registers the device for remote push notifications
    func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
            self.isRegisteredForRemoteNotifications = true
        }
    }
    
    /// Handles user response to a notification
    /// - Parameter response: The user's response to the notification
    func handleNotificationResponse(_ response: UNNotificationResponse) {
        let userInfo = response.notification.request.content.userInfo
        let actionIdentifier = response.actionIdentifier
        
        // Process the notification response based on the action
        switch actionIdentifier {
        case UNNotificationDefaultActionIdentifier:
            // Handle default action (user tapped notification)
            processNotificationTap(userInfo: userInfo)
            
        case UNNotificationDismissActionIdentifier:
            // Handle dismiss action
            break
            
        default:
            // Handle custom actions
            processCustomAction(identifier: actionIdentifier, userInfo: userInfo)
        }
    }
    
    // MARK: - Private Methods
    
    private func updateNotificationPermissionStatus() async {
        let settings = await center.notificationSettings()
        hasNotificationPermission = settings.authorizationStatus == .authorized
    }
    
    private func processNotificationTap(userInfo: [AnyHashable: Any]) {
        // Handle notification tap based on userInfo content
        // Implementation depends on specific notification types and required actions
    }
    
    private func processCustomAction(identifier: String, userInfo: [AnyHashable: Any]) {
        // Handle custom notification actions
        // Implementation depends on defined notification categories and actions
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension NotificationManager: UNUserNotificationCenterDelegate {
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Configure presentation options for foreground notifications
        let options: UNNotificationPresentationOptions = [.banner, .sound, .badge]
        completionHandler(options)
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        // Handle the notification response
        handleNotificationResponse(response)
        completionHandler()
    }
}