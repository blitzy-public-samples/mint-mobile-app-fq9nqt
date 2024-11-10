// SwiftUI framework - iOS 14.0+
import SwiftUI

// MARK: - Human Tasks
/*
 1. Verify haptic feedback is enabled in device settings
 2. Test VoiceOver interaction with all button states
 3. Verify minimum touch target size compliance on all devices
 4. Test color contrast ratios in both light and dark modes
 5. Confirm button states are distinguishable for colorblind users
*/

// MARK: - Global Constants
private let minimumTouchSize: CGFloat = 44.0
private let defaultButtonHeight: CGFloat = 48.0

// MARK: - Button Style Enum
/// Defines available button styles with associated colors and states
@frozen public enum ButtonStyle {
    case primary
    case secondary
    case outline
    case destructive
}

// MARK: - Button State Enum
/// Defines possible button states for appearance and interaction
@frozen private enum ButtonState {
    case normal
    case pressed
    case disabled
    case loading
}

// MARK: - CustomButton
/// A customizable button component that follows the application's design system with comprehensive accessibility support
/// Implements requirements: Mobile Applications Design (5.2.1), Accessibility Features (8.1.8), Design System Key (8.1.1)
@frozen public struct CustomButton: View {
    // MARK: - Properties
    private let title: String
    private let style: ButtonStyle
    private let action: () -> Void
    
    @State private var buttonState: ButtonState = .normal
    @State private var isPressed: Bool = false
    
    private let feedbackGenerator = UIImpactFeedbackGenerator(style: .medium)
    
    @Binding private var isEnabled: Bool
    @Binding private var isLoading: Bool
    
    private let height: CGFloat
    
    // MARK: - Initialization
    /// Initializes button with required properties and accessibility configuration
    public init(
        title: String,
        style: ButtonStyle = .primary,
        isEnabled: Binding<Bool> = .constant(true),
        isLoading: Binding<Bool> = .constant(false),
        height: CGFloat = defaultButtonHeight,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.style = style
        self.action = action
        self._isEnabled = isEnabled
        self._isLoading = isLoading
        self.height = max(height, minimumTouchSize)
        
        // Prepare haptic feedback
        feedbackGenerator.prepare()
    }
    
    // MARK: - Body
    public var body: some View {
        Button(action: handlePress) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: textColor))
                }
                
                Text(title)
                    .font(Typography.shared.body)
                    .foregroundColor(textColor)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity)
            .frame(height: height)
            .background(backgroundColor)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.shared.cornerRadius)
                    .stroke(borderColor, lineWidth: style == .outline ? 2 : 0)
            )
            .cornerRadius(AppTheme.shared.cornerRadius)
            .opacity(buttonOpacity)
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        }
        .disabled(!isEnabled || isLoading)
        .accessibilityLabel(title)
        .accessibilityHint(accessibilityHint)
        .accessibilityAddTraits(.isButton)
        .accessibilityValue(isLoading ? "Loading" : "")
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    if !isPressed {
                        isPressed = true
                        updateAppearance(.pressed)
                    }
                }
                .onEnded { _ in
                    isPressed = false
                    updateAppearance(.normal)
                }
        )
        .frame(minWidth: minimumTouchSize, minHeight: minimumTouchSize)
    }
    
    // MARK: - Computed Properties
    private var backgroundColor: Color {
        switch (style, buttonState) {
        case (.primary, .normal):
            return AppTheme.shared.primary
        case (.primary, .pressed):
            return AppTheme.shared.primary.opacity(0.8)
        case (.primary, .disabled):
            return AppTheme.shared.primary.opacity(0.5)
        case (.secondary, .normal):
            return AppTheme.shared.secondary
        case (.secondary, .pressed):
            return AppTheme.shared.secondary.opacity(0.8)
        case (.secondary, .disabled):
            return AppTheme.shared.secondary.opacity(0.5)
        case (.outline, _):
            return .clear
        case (.destructive, .normal):
            return AppTheme.shared.error
        case (.destructive, .pressed):
            return AppTheme.shared.error.opacity(0.8)
        case (.destructive, .disabled):
            return AppTheme.shared.error.opacity(0.5)
        default:
            return AppTheme.shared.primary.opacity(0.5)
        }
    }
    
    private var textColor: Color {
        switch style {
        case .outline:
            return isEnabled ? AppTheme.shared.primary : AppTheme.shared.textDisabled
        case .primary, .secondary, .destructive:
            return isEnabled ? .white : .white.opacity(0.7)
        }
    }
    
    private var borderColor: Color {
        switch (style, buttonState) {
        case (.outline, .normal):
            return AppTheme.shared.primary
        case (.outline, .pressed):
            return AppTheme.shared.primary.opacity(0.8)
        case (.outline, .disabled):
            return AppTheme.shared.primary.opacity(0.5)
        default:
            return .clear
        }
    }
    
    private var buttonOpacity: Double {
        buttonState == .disabled ? 0.5 : 1.0
    }
    
    private var accessibilityHint: String {
        if !isEnabled {
            return "Button is disabled"
        } else if isLoading {
            return "Button is loading"
        }
        return ""
    }
    
    // MARK: - Private Methods
    /// Updates button appearance based on state with smooth animations
    private func updateAppearance(_ state: ButtonState) {
        withAnimation(.easeInOut(duration: 0.2)) {
            buttonState = state
        }
    }
    
    /// Handles button press with haptic feedback and state updates
    private func handlePress() {
        guard isEnabled && !isLoading else { return }
        
        // Generate haptic feedback
        feedbackGenerator.impactOccurred()
        
        // Execute action
        action()
        
        // Update button state
        updateAppearance(.pressed)
        
        // Reset button state after delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            updateAppearance(.normal)
        }
    }
}

// MARK: - Preview Provider
#if DEBUG
struct CustomButton_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            CustomButton(
                title: "Primary Button",
                style: .primary,
                action: {}
            )
            
            CustomButton(
                title: "Secondary Button",
                style: .secondary,
                action: {}
            )
            
            CustomButton(
                title: "Outline Button",
                style: .outline,
                action: {}
            )
            
            CustomButton(
                title: "Destructive Button",
                style: .destructive,
                action: {}
            )
            
            CustomButton(
                title: "Disabled Button",
                style: .primary,
                isEnabled: .constant(false),
                action: {}
            )
            
            CustomButton(
                title: "Loading Button",
                style: .primary,
                isLoading: .constant(true),
                action: {}
            )
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}
#endif