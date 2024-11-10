// iOS 15.0+ Required
import SwiftUI
import Combine
import LocalAuthentication

/* Human Tasks:
1. Configure Face ID/Touch ID usage description in Info.plist
2. Set up proper keychain access group in entitlements
3. Verify accessibility labels are properly localized
4. Test VoiceOver navigation flow
5. Verify dynamic type scaling works correctly
6. Test color contrast ratios in both light and dark modes
*/

/// SwiftUI view implementing the login screen with comprehensive accessibility support
/// Requirements addressed:
/// - Secure user authentication (1.2 Scope/Core Features)
/// - Authentication Methods (9.1.1 Authentication Methods)
/// - Mobile UI Design (8.1 User Interface Design)
@MainActor
struct LoginView: View {
    // MARK: - Properties
    @StateObject private var viewModel: LoginViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showingError: Bool = false
    @State private var isKeyboardVisible: Bool = false
    @FocusState private var focusedField: Field?
    
    private let theme = AppTheme.shared
    private let minimumSpacing: CGFloat = 16
    
    // MARK: - Focus Fields
    private enum Field {
        case email
        case password
    }
    
    // MARK: - Initialization
    init() {
        let authRepository = AuthRepository()
        let biometricUtils = BiometricUtils()
        _viewModel = StateObject(wrappedValue: LoginViewModel(
            authRepository: authRepository,
            biometricUtils: biometricUtils
        ))
    }
    
    // MARK: - Body
    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(spacing: minimumSpacing) {
                    // App Logo
                    Image("AppLogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: geometry.size.width * 0.4)
                        .padding(.top, geometry.safeAreaInsets.top + minimumSpacing)
                        .accessibilityLabel("Mint Replica Lite Logo")
                    
                    // Login Form
                    VStack(spacing: minimumSpacing) {
                        // Email Field
                        CustomTextField(
                            text: $viewModel.email,
                            placeholder: "Email",
                            title: "Email Address",
                            contentType: .emailAddress,
                            keyboardType: .emailAddress
                        )
                        .focused($focusedField, equals: .email)
                        
                        // Password Field
                        CustomTextField(
                            text: $viewModel.password,
                            placeholder: "Password",
                            title: "Password",
                            isSecure: true,
                            contentType: .password
                        )
                        .focused($focusedField, equals: .password)
                        
                        // Login Button
                        CustomButton(
                            title: "Log In",
                            style: .primary,
                            isLoading: .init(
                                get: { viewModel.state == .loading },
                                set: { _ in }
                            )
                        ) {
                            handleLogin()
                        }
                        .disabled(viewModel.state == .loading)
                        
                        // Biometric Login Button
                        if viewModel.isBiometricAvailable {
                            CustomButton(
                                title: biometricButtonTitle,
                                style: .outline
                            ) {
                                handleBiometricLogin()
                            }
                            .disabled(viewModel.state == .loading)
                        }
                        
                        // Forgot Password Link
                        Button(action: { /* Handle forgot password */ }) {
                            Text("Forgot Password?")
                                .font(theme.configureTextStyle(size: 14, weight: .medium))
                                .foregroundColor(theme.primary)
                                .padding(.vertical, 8)
                        }
                        .accessibilityHint("Double tap to reset your password")
                    }
                    .padding(.horizontal, minimumSpacing)
                }
                .frame(minHeight: geometry.size.height)
            }
            .scrollDismissesKeyboard(.immediately)
        }
        .navigationBarTitleDisplayMode(.inline)
        .alert("Error", isPresented: $showingError) {
            Button("OK", role: .cancel) {
                showingError = false
            }
        } message: {
            Text(viewModel.errorMessage ?? "An error occurred")
        }
        .onChange(of: viewModel.errorMessage) { newError in
            showingError = newError != nil
        }
        .onAppear {
            setupKeyboardNotifications()
        }
        .onDisappear {
            removeKeyboardNotifications()
        }
    }
    
    // MARK: - Computed Properties
    private var biometricButtonTitle: String {
        switch viewModel.biometricType {
        case .faceID:
            return "Sign in with Face ID"
        case .touchID:
            return "Sign in with Touch ID"
        default:
            return "Sign in with Biometrics"
        }
    }
    
    // MARK: - Methods
    private func handleLogin() {
        dismissKeyboard()
        
        Task {
            do {
                try await viewModel.login().async()
                dismiss()
            } catch {
                showingError = true
                // Provide haptic feedback for error
                UINotificationFeedbackGenerator().notificationOccurred(.error)
            }
        }
    }
    
    private func handleBiometricLogin() {
        Task {
            do {
                try await viewModel.loginWithBiometric().async()
                dismiss()
            } catch {
                showingError = true
                // Provide haptic feedback for error
                UINotificationFeedbackGenerator().notificationOccurred(.error)
            }
        }
    }
    
    private func dismissKeyboard() {
        focusedField = nil
    }
    
    // MARK: - Keyboard Handling
    private func setupKeyboardNotifications() {
        NotificationCenter.default.addObserver(
            forName: UIResponder.keyboardWillShowNotification,
            object: nil,
            queue: .main
        ) { _ in
            isKeyboardVisible = true
        }
        
        NotificationCenter.default.addObserver(
            forName: UIResponder.keyboardWillHideNotification,
            object: nil,
            queue: .main
        ) { _ in
            isKeyboardVisible = false
        }
    }
    
    private func removeKeyboardNotifications() {
        NotificationCenter.default.removeObserver(
            self,
            name: UIResponder.keyboardWillShowNotification,
            object: nil
        )
        NotificationCenter.default.removeObserver(
            self,
            name: UIResponder.keyboardWillHideNotification,
            object: nil
        )
    }
}

// MARK: - Preview Provider
#if DEBUG
struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            LoginView()
        }
    }
}
#endif