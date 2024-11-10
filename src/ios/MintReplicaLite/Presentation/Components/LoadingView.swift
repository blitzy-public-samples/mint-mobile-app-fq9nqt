// SwiftUI framework - iOS 14.0+
import SwiftUI

// MARK: - Human Tasks
/*
 1. Verify that the app's Info.plist includes accessibility usage descriptions
 2. Test loading view with VoiceOver enabled to ensure proper accessibility experience
 3. Verify loading view appearance in both light and dark modes
 4. Test with different Dynamic Type size settings
*/

// MARK: - LoadingView
/// A reusable SwiftUI loading indicator component that displays an activity spinner
/// with optional message text and accessibility support
/// Implements requirements:
/// - Mobile Applications Design (5.2.1): Native iOS loading indicator using SwiftUI
/// - User Interface Design (8.1.1): Consistent loading state visualization
/// - Accessibility Features (8.1.8): Voice over and dynamic type support
@available(iOS 14.0, *)
struct LoadingView: View {
    // MARK: - Properties
    private let message: String?
    private let spinnerSize: CGFloat
    private let backgroundOpacity: Double
    
    // MARK: - Environment
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.sizeCategory) private var sizeCategory
    
    // MARK: - Constants
    private let defaultSpinnerSize: CGFloat = 40.0
    private let defaultBackgroundOpacity: Double = 0.6
    
    // MARK: - Initialization
    /// Creates a loading view with customizable appearance
    /// - Parameters:
    ///   - message: Optional text to display below the spinner
    ///   - spinnerSize: Size of the activity indicator (default: 40.0)
    ///   - backgroundOpacity: Opacity of the background overlay (default: 0.6)
    init(
        message: String? = nil,
        spinnerSize: CGFloat = 40.0,
        backgroundOpacity: Double = 0.6
    ) {
        self.message = message
        self.spinnerSize = spinnerSize
        self.backgroundOpacity = backgroundOpacity
    }
    
    // MARK: - Body
    var body: some View {
        ZStack {
            // Semi-transparent background overlay
            Color(UIColor.systemBackground)
                .opacity(backgroundOpacity)
                .edgesIgnoringSafeArea(.all)
            
            // Loading content container
            VStack(spacing: AppTheme.shared.spacing) {
                // Activity indicator
                ProgressView()
                    .scaleEffect(spinnerSize / defaultSpinnerSize)
                    .progressViewStyle(CircularProgressViewStyle(
                        tint: AppTheme.shared.colors.primary
                    ))
                    .accessibility(label: Text("Loading"))
                    .accessibility(addTraits: .isImage)
                
                // Optional message text
                if let message = message {
                    Text(message)
                        .font(AppTheme.shared.configureTextStyle(
                            size: 16,
                            weight: .medium
                        ))
                        .foregroundColor(AppTheme.shared.colors.textSecondary)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibility(addTraits: .updatesFrequently)
                }
            }
            .padding(AppTheme.shared.spacing * 2)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.shared.cornerRadius)
                    .fill(AppTheme.shared.colors.surface)
                    .shadow(
                        radius: AppTheme.shared.shadowRadius,
                        x: 0,
                        y: 2
                    )
            )
            .padding(.horizontal, AppTheme.shared.spacing * 2)
        }
        .animation(.easeInOut(duration: 0.2), value: message)
        .transition(.opacity)
        .accessibility(addTraits: .isModal)
        .accessibility(sortPriority: 1)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            message != nil ?
            "Loading, \(message!)" : "Loading"
        )
        .accessibilityHint("Please wait while content is loading")
    }
}

// MARK: - Preview Provider
struct LoadingView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Default loading view
            LoadingView()
                .previewDisplayName("Default")
            
            // Loading view with message
            LoadingView(message: "Updating account...")
                .previewDisplayName("With Message")
            
            // Loading view with custom size
            LoadingView(
                message: "Processing...",
                spinnerSize: 60.0
            )
            .previewDisplayName("Large Spinner")
            
            // Dark mode preview
            LoadingView(message: "Loading data...")
                .preferredColorScheme(.dark)
                .previewDisplayName("Dark Mode")
            
            // Accessibility - Large Text
            LoadingView(message: "Please wait...")
                .environment(\.sizeCategory, .accessibilityLarge)
                .previewDisplayName("Large Dynamic Type")
        }
    }
}