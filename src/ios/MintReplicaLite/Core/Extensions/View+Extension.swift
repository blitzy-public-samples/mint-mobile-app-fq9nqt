// SwiftUI framework - iOS 14.0+
import SwiftUI

// MARK: - Human Tasks
/*
1. Verify Face ID/Touch ID usage description is added to Info.plist
2. Test loading view with VoiceOver enabled
3. Verify proper error handling for biometric authentication failures
4. Test corner radius modifier with different corner combinations
5. Verify smooth transitions for loading states
*/

// MARK: - View Extension
/// Extension providing common view modifiers for consistent UI behavior and appearance
/// Implements requirements from Mobile Applications Design and User Interface Design
@available(iOS 14.0, *)
extension View {
    
    // MARK: - Loading Modifier
    /// Applies a loading overlay with accessibility support
    /// - Parameters:
    ///   - isLoading: Boolean indicating if loading state is active
    ///   - message: Optional message to display during loading
    /// - Returns: Modified view with loading overlay when active
    @ViewBuilder
    func loading(
        _ isLoading: Bool,
        message: String? = nil
    ) -> some View {
        self.modifier(LoadingViewModifier(
            isLoading: isLoading,
            message: message
        ))
    }
    
    // MARK: - Biometric Authentication Modifier
    /// Requires biometric authentication before showing content
    /// - Parameters:
    ///   - reason: Localized reason for requesting authentication
    ///   - isAuthenticated: Binding to track authentication state
    /// - Returns: View protected by biometric authentication
    @ViewBuilder
    func withBiometricAuth(
        reason: String,
        isAuthenticated: Binding<Bool>
    ) -> some View {
        self.modifier(BiometricAuthModifier(
            reason: reason,
            isAuthenticated: isAuthenticated
        ))
    }
    
    // MARK: - Corner Radius Modifier
    /// Applies consistent corner radius styling to specific corners
    /// - Parameters:
    ///   - radius: Corner radius value
    ///   - corners: UIRectCorner specifying which corners to round
    /// - Returns: View with applied corner radius
    @ViewBuilder
    func cornerRadius(
        _ radius: CGFloat,
        corners: UIRectCorner
    ) -> some View {
        self.modifier(CornerRadiusModifier(
            radius: radius,
            corners: corners
        ))
    }
}

// MARK: - Loading View Modifier
/// Custom view modifier for loading state overlay
private struct LoadingViewModifier: ViewModifier {
    let isLoading: Bool
    let message: String?
    
    func body(content: Content) -> some View {
        ZStack {
            content
                .disabled(isLoading)
                .accessibility(hidden: isLoading)
            
            if isLoading {
                LoadingView(message: message)
                    .transition(.opacity)
                    .zIndex(1)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isLoading)
    }
}

// MARK: - Biometric Authentication Modifier
/// Custom view modifier for biometric authentication
private struct BiometricAuthModifier: ViewModifier {
    let reason: String
    @Binding var isAuthenticated: Bool
    @State private var showError: Bool = false
    @State private var errorMessage: String = ""
    
    func body(content: Content) -> some View {
        Group {
            if isAuthenticated {
                content
            } else {
                Color.clear
                    .onAppear {
                        authenticate()
                    }
            }
        }
        .alert(isPresented: $showError) {
            Alert(
                title: Text("Authentication Failed"),
                message: Text(errorMessage),
                dismissButton: .default(Text("OK"))
            )
        }
    }
    
    private func authenticate() {
        let result = BiometricUtils.shared.authenticateUser(reason: reason)
        
        switch result {
        case .success(let authenticated):
            isAuthenticated = authenticated
        case .failure(let error):
            isAuthenticated = false
            switch error {
            case .notAvailable:
                errorMessage = "Biometric authentication is not available on this device."
            case .notEnrolled:
                errorMessage = "No biometric data is enrolled on this device."
            case .lockout:
                errorMessage = "Biometric authentication is locked due to too many failed attempts."
            case .canceled:
                errorMessage = "Authentication was canceled."
            case .invalidated:
                errorMessage = "Biometric authentication was invalidated."
            case .systemError(let error):
                errorMessage = "Authentication failed: \(error.localizedDescription)"
            }
            showError = true
        }
    }
}

// MARK: - Corner Radius Modifier
/// Custom view modifier for corner radius styling
private struct CornerRadiusModifier: ViewModifier {
    let radius: CGFloat
    let corners: UIRectCorner
    
    func body(content: Content) -> some View {
        content
            .clipShape(
                CornerRadiusShape(
                    radius: radius,
                    corners: corners
                )
            )
    }
}

// MARK: - Corner Radius Shape
/// Custom shape for applying corner radius to specific corners
private struct CornerRadiusShape: Shape {
    let radius: CGFloat
    let corners: UIRectCorner
    
    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(
                width: radius,
                height: radius
            )
        )
        return Path(path.cgPath)
    }
}

// MARK: - Requirements Implementation Comments
/*
 Requirement: Mobile Applications Design (5.2.1)
 Implementation: Implements native iOS view extensions using SwiftUI for consistent UI behavior
 
 Requirement: User Interface Design (8.1)
 Implementation: Provides reusable view modifiers for consistent layout and styling
 
 Requirement: Accessibility Features (8.1.8)
 Implementation: Implements accessibility modifiers with proper VoiceOver support and dynamic type
*/