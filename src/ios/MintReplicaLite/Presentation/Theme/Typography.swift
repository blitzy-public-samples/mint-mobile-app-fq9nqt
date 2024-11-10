// SwiftUI framework - iOS 14.0+
import SwiftUI

// MARK: - Human Tasks
/*
 1. Verify that the app's Info.plist includes the UIAppFonts key if custom fonts are added
 2. Ensure Dynamic Type is enabled in the app's capabilities
 3. Test typography scaling with all Dynamic Type size categories
 4. Verify VoiceOver reads text elements correctly
 5. Confirm minimum text size compliance across all device sizes
*/

// MARK: - Global Constants
private let defaultTextSize: CGFloat = 16.0
private let defaultLineHeight: CGFloat = 1.2
private let minimumAccessibleTextSize: CGFloat = 16.0

// MARK: - Typography Class
/// Main typography class that defines text styles and fonts with comprehensive accessibility support
/// Implements requirement: Design System Key (8.1.1)
@frozen public class Typography {
    // MARK: - Singleton
    public static let shared = Typography()
    
    // MARK: - Text Style Properties
    public private(set) var largeTitle: Font
    public private(set) var title1: Font
    public private(set) var title2: Font
    public private(set) var title3: Font
    public private(set) var headline: Font
    public private(set) var subheadline: Font
    public private(set) var body: Font
    public private(set) var callout: Font
    public private(set) var footnote: Font
    public private(set) var caption1: Font
    public private(set) var caption2: Font
    
    // MARK: - Accessibility Properties
    public private(set) var isAccessibilityEnabled: Bool
    
    // MARK: - Initialization
    private init() {
        // Initialize text styles with dynamic type support
        // Implements requirement: Mobile Applications Design (5.2.1)
        self.largeTitle = Self.configureTextStyle(style: .largeTitle, weight: .bold)
        self.title1 = Self.configureTextStyle(style: .title1, weight: .bold)
        self.title2 = Self.configureTextStyle(style: .title2, weight: .bold)
        self.title3 = Self.configureTextStyle(style: .title3, weight: .semibold)
        self.headline = Self.configureTextStyle(style: .headline, weight: .semibold)
        self.subheadline = Self.configureTextStyle(style: .subheadline, weight: .regular)
        self.body = Self.configureTextStyle(style: .body, weight: .regular)
        self.callout = Self.configureTextStyle(style: .callout, weight: .regular)
        self.footnote = Self.configureTextStyle(style: .footnote, weight: .regular)
        self.caption1 = Self.configureTextStyle(style: .caption1, weight: .regular)
        self.caption2 = Self.configureTextStyle(style: .caption2, weight: .regular)
        
        self.isAccessibilityEnabled = UIAccessibility.isVoiceOverRunning
        
        // Configure initial accessibility settings
        updateForAccessibility(UIAccessibility.isBoldTextEnabled)
        
        // Register for accessibility notifications
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAccessibilityStatusChange),
            name: UIAccessibility.voiceOverStatusDidChangeNotification,
            object: nil
        )
    }
    
    // MARK: - Font Scaling
    /// Scales font size based on accessibility settings and dynamic type preferences
    /// Implements requirement: Accessibility Features (8.1.8)
    public static func scaleFontSize(size: CGFloat, isAccessibilityCategory: Bool) -> CGFloat {
        let metrics = UIFontMetrics.default
        var scaledSize = metrics.scaledValue(for: size)
        
        // Apply additional scaling for accessibility categories
        if isAccessibilityCategory {
            scaledSize *= 1.2
        }
        
        // Ensure minimum readable size
        return max(scaledSize, minimumAccessibleTextSize)
    }
    
    // MARK: - Text Style Configuration
    /// Configures text style with dynamic type and accessibility support
    /// Implements requirement: Design System Key (8.1.1)
    private static func configureTextStyle(style: Font.TextStyle, weight: Font.Weight) -> Font {
        let font = Font.system(style, design: .default).weight(weight)
        
        // Configure accessibility traits
        let traits: UIAccessibilityTraits = style == .largeTitle || style == .title1
            ? .header
            : []
        
        // Apply font metrics for dynamic type
        let metrics = UIFontMetrics(forTextStyle: UIFont.TextStyle(rawValue: style.rawValue))
        let baseSize = UIFont.preferredFont(forTextStyle: UIFont.TextStyle(rawValue: style.rawValue)).pointSize
        let scaledSize = metrics.scaledValue(for: baseSize)
        
        return Font.system(size: scaledSize, weight: weight, design: .default)
    }
    
    // MARK: - Accessibility Updates
    /// Updates typography for accessibility settings changes
    /// Implements requirement: Accessibility Features (8.1.8)
    public func updateForAccessibility(_ isAccessibilityCategory: Bool) {
        self.isAccessibilityEnabled = isAccessibilityCategory
        
        // Update text styles with new accessibility settings
        largeTitle = Self.configureTextStyle(style: .largeTitle, weight: isAccessibilityCategory ? .bold : .regular)
        title1 = Self.configureTextStyle(style: .title1, weight: isAccessibilityCategory ? .bold : .regular)
        title2 = Self.configureTextStyle(style: .title2, weight: isAccessibilityCategory ? .bold : .regular)
        title3 = Self.configureTextStyle(style: .title3, weight: isAccessibilityCategory ? .semibold : .regular)
        headline = Self.configureTextStyle(style: .headline, weight: isAccessibilityCategory ? .semibold : .regular)
        subheadline = Self.configureTextStyle(style: .subheadline, weight: .regular)
        body = Self.configureTextStyle(style: .body, weight: .regular)
        callout = Self.configureTextStyle(style: .callout, weight: .regular)
        footnote = Self.configureTextStyle(style: .footnote, weight: .regular)
        caption1 = Self.configureTextStyle(style: .caption1, weight: .regular)
        caption2 = Self.configureTextStyle(style: .caption2, weight: .regular)
        
        // Configure line heights for optimal legibility
        AppTheme.shared.configureTextStyle(size: defaultTextSize, weight: .regular)
    }
    
    // MARK: - Accessibility Handlers
    @objc private func handleAccessibilityStatusChange() {
        updateForAccessibility(UIAccessibility.isBoldTextEnabled)
    }
    
    // MARK: - Deinitialization
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}

// MARK: - Font Extensions
extension Font {
    /// Applies dynamic type scaling with accessibility support
    /// Implements requirement: Accessibility Features (8.1.8)
    public func withAccessibility() -> Font {
        let metrics = UIFontMetrics.default
        let descriptor = UIFont.preferredFont(forTextStyle: .body).fontDescriptor
        let size = descriptor.pointSize
        let scaledSize = Typography.scaleFontSize(size: size, isAccessibilityCategory: UIAccessibility.isBoldTextEnabled)
        return Font(UIFont(descriptor: descriptor, size: scaledSize))
    }
}