// SwiftUI framework - iOS 14.0+
import SwiftUI

// MARK: - Global Constants
private let defaultCornerRadius: CGFloat = 12.0
private let defaultSpacing: CGFloat = 16.0
private let defaultShadowRadius: CGFloat = 4.0
private let minimumContrastRatio: CGFloat = 4.5
private let largeTextContrastRatio: CGFloat = 3.0

// MARK: - AppTheme Class
/// Main theme class that defines global styling and design tokens
/// Implements requirement: Design System Key (8.1.1)
@frozen public class AppTheme {
    // MARK: - Singleton
    public static let shared = AppTheme()
    
    // MARK: - Color Properties
    public private(set) var primary: Color
    public private(set) var secondary: Color
    public private(set) var accent: Color
    public private(set) var background: Color
    public private(set) var surface: Color
    public private(set) var error: Color
    public private(set) var success: Color
    public private(set) var warning: Color
    public private(set) var textPrimary: Color
    public private(set) var textSecondary: Color
    public private(set) var textDisabled: Color
    
    // MARK: - Layout Properties
    public private(set) var cornerRadius: CGFloat
    public private(set) var spacing: CGFloat
    public private(set) var shadowRadius: CGFloat
    
    // MARK: - Typography Properties
    public private(set) var titleFont: Font
    public private(set) var headingFont: Font
    public private(set) var bodyFont: Font
    public private(set) var captionFont: Font
    
    // MARK: - Accessibility Properties
    public private(set) var isHighContrastEnabled: Bool
    public private(set) var dynamicTypeSize: CGFloat
    
    // MARK: - Private Color Storage
    private var lightModeColors: [String: Color]
    private var darkModeColors: [String: Color]
    
    // MARK: - Initialization
    private init() {
        // Initialize semantic color palette
        // Implements requirement: Mobile Applications Design (5.2.1)
        self.primary = Color(red: 0.0, green: 0.478, blue: 1.0)
        self.secondary = Color(red: 0.235, green: 0.235, blue: 0.263)
        self.accent = Color(red: 1.0, green: 0.584, blue: 0.0)
        self.background = Color(red: 0.949, green: 0.949, blue: 0.969)
        self.surface = Color.white
        self.error = Color(red: 1.0, green: 0.231, blue: 0.188)
        self.success = Color(red: 0.298, green: 0.851, blue: 0.392)
        self.warning = Color(red: 1.0, green: 0.8, blue: 0.0)
        self.textPrimary = Color(red: 0.0, green: 0.0, blue: 0.0)
        self.textSecondary = Color(red: 0.235, green: 0.235, blue: 0.263)
        self.textDisabled = Color(red: 0.557, green: 0.557, blue: 0.576)
        
        // Store color sets for mode switching
        self.lightModeColors = [
            "primary": self.primary,
            "secondary": self.secondary,
            "accent": self.accent,
            "background": self.background,
            "surface": self.surface,
            "textPrimary": self.textPrimary,
            "textSecondary": self.textSecondary,
            "textDisabled": self.textDisabled
        ]
        
        self.darkModeColors = [
            "primary": Color(red: 0.0, green: 0.478, blue: 1.0),
            "secondary": Color(red: 0.922, green: 0.922, blue: 0.961),
            "accent": Color(red: 1.0, green: 0.584, blue: 0.0),
            "background": Color(red: 0.0, green: 0.0, blue: 0.0),
            "surface": Color(red: 0.141, green: 0.141, blue: 0.141),
            "textPrimary": Color.white,
            "textSecondary": Color(red: 0.922, green: 0.922, blue: 0.961),
            "textDisabled": Color(red: 0.557, green: 0.557, blue: 0.576)
        ]
        
        // Initialize layout properties
        self.cornerRadius = defaultCornerRadius
        self.spacing = defaultSpacing
        self.shadowRadius = defaultShadowRadius
        
        // Initialize typography with dynamic type support
        self.titleFont = .system(size: 28, weight: .bold, design: .default)
        self.headingFont = .system(size: 20, weight: .semibold, design: .default)
        self.bodyFont = .system(size: 16, weight: .regular, design: .default)
        self.captionFont = .system(size: 12, weight: .regular, design: .default)
        
        // Initialize accessibility properties
        self.isHighContrastEnabled = false
        self.dynamicTypeSize = UIFontMetrics.default.scaledValue(for: 16)
    }
    
    // MARK: - Theme Update Methods
    /// Updates theme colors based on system color scheme
    /// Implements requirement: Mobile Applications Design (5.2.1)
    public func updateForColorScheme(_ scheme: ColorScheme) {
        let colors = scheme == .dark ? darkModeColors : lightModeColors
        
        self.primary = colors["primary"] ?? self.primary
        self.secondary = colors["secondary"] ?? self.secondary
        self.accent = colors["accent"] ?? self.accent
        self.background = colors["background"] ?? self.background
        self.surface = colors["surface"] ?? self.surface
        self.textPrimary = colors["textPrimary"] ?? self.textPrimary
        self.textSecondary = colors["textSecondary"] ?? self.textSecondary
        self.textDisabled = colors["textDisabled"] ?? self.textDisabled
        
        // Adjust shadow properties for dark mode
        self.shadowRadius = scheme == .dark ? defaultShadowRadius * 1.5 : defaultShadowRadius
    }
    
    /// Adjusts color brightness by the specified percentage
    /// Implements requirement: Accessibility Support (8.1.8)
    public func adjustColorBrightness(_ color: Color, percentage: CGFloat) -> Color {
        guard let components = UIColor(color).cgColor.components else { return color }
        
        let red = min(max(components[0] * (1 + percentage), 0), 1)
        let green = min(max(components[1] * (1 + percentage), 0), 1)
        let blue = min(max(components[2] * (1 + percentage), 0), 1)
        
        return Color(.sRGB, red: Double(red), green: Double(green), blue: Double(blue), opacity: 1)
    }
    
    /// Calculates WCAG 2.1 contrast ratio between two colors
    /// Implements requirement: Accessibility Support (8.1.8)
    public func calculateContrastRatio(_ color1: Color, _ color2: Color) -> CGFloat {
        func luminance(_ color: Color) -> CGFloat {
            let components = UIColor(color).cgColor.components ?? [0, 0, 0, 1]
            let rgb = [components[0], components[1], components[2]].map { value in
                let v = value <= 0.03928 ? value / 12.92 : pow((value + 0.055) / 1.055, 2.4)
                return CGFloat(v)
            }
            return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
        }
        
        let l1 = luminance(color1)
        let l2 = luminance(color2)
        let lightest = max(l1, l2)
        let darkest = min(l1, l2)
        
        return (lightest + 0.05) / (darkest + 0.05)
    }
    
    /// Adjusts colors for high contrast accessibility mode
    /// Implements requirement: Accessibility Support (8.1.8)
    public func applyHighContrastMode(_ enabled: Bool) {
        self.isHighContrastEnabled = enabled
        
        if enabled {
            // Increase contrast for text colors
            self.textPrimary = Color.black
            self.textSecondary = Color(red: 0.235, green: 0.235, blue: 0.263)
            
            // Adjust primary colors for better visibility
            self.primary = adjustColorBrightness(self.primary, percentage: 0.1)
            self.accent = adjustColorBrightness(self.accent, percentage: 0.1)
            
            // Ensure background contrast meets WCAG requirements
            if calculateContrastRatio(self.textPrimary, self.background) < minimumContrastRatio {
                self.background = Color(red: 0.949, green: 0.949, blue: 0.969)
            }
        } else {
            // Restore default colors
            updateForColorScheme(UITraitCollection.current.userInterfaceStyle == .dark ? .dark : .light)
        }
    }
    
    /// Configures text style with specified size and weight
    /// Implements requirement: Design System Key (8.1.1)
    public func configureTextStyle(size: CGFloat, weight: Font.Weight) -> Font {
        let scaledSize = UIFontMetrics.default.scaledValue(for: size)
        let style = Font.system(size: scaledSize, weight: weight, design: .default)
        
        // Ensure minimum text size requirements are met
        let minimumSize: CGFloat = 12
        return scaledSize < minimumSize ? .system(size: minimumSize, weight: weight) : style
    }
}