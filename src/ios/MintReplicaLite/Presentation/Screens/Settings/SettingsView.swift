// SwiftUI framework - iOS 14.0+
import SwiftUI
// Combine framework - iOS 14.0+
import Combine

/* Human Tasks:
1. Add Face ID/Touch ID usage description to Info.plist
2. Configure APNS certificates and keys in Apple Developer Portal
3. Add notification permission request description to Info.plist
4. Review accessibility labels for localization
5. Test VoiceOver navigation flow
6. Verify minimum touch target sizes (44x44 points)
7. Test color contrast ratios in both light and dark modes
*/

/// SwiftUI view that implements the settings screen with comprehensive accessibility support
/// Requirements addressed:
/// - Mobile Applications (5.2.1): Native iOS application using Swift and SwiftUI
/// - Authentication Methods (9.1.1): Biometric authentication configuration through iOS Face ID/Touch ID
/// - Real-time notification system (1.1): User notification preferences management
/// - Accessibility Features (8.1.8): High contrast support, minimum touch targets, VoiceOver compatibility
@MainActor
struct SettingsView: View {
    // MARK: - Properties
    @StateObject private var viewModel = SettingsViewModel(biometricUtils: BiometricUtils())
    @Environment(\.presentationMode) private var presentationMode
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.sizeCategory) private var sizeCategory
    
    private let theme = AppTheme.shared
    
    // MARK: - Body
    var body: some View {
        NavigationView {
            List {
                biometricSection()
                    .listRowBackground(theme.surface)
                
                notificationSection()
                    .listRowBackground(theme.surface)
                
                aboutSection()
                    .listRowBackground(theme.surface)
            }
            .listStyle(InsetGroupedListStyle())
            .background(theme.background.ignoresSafeArea())
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .alert(item: Binding(
                get: { viewModel.errorMessage.map { ErrorAlert(message: $0) } },
                set: { _ in viewModel.errorMessage = nil }
            )) { error in
                Alert(
                    title: Text("Error"),
                    message: Text(error.message),
                    dismissButton: .default(Text("OK"))
                )
            }
            .onAppear {
                viewModel.initialize()
            }
        }
        .navigationViewStyle(StackNavigationViewStyle())
        .accentColor(theme.primary)
    }
    
    // MARK: - Sections
    private func biometricSection() -> some View {
        Section {
            VStack(alignment: .leading, spacing: theme.spacing) {
                Toggle(isOn: Binding(
                    get: { viewModel.isBiometricsEnabled },
                    set: { _ in viewModel.toggleBiometrics() }
                )) {
                    HStack {
                        Image(systemName: "faceid")
                            .foregroundColor(theme.primary)
                            .accessibility(hidden: true)
                        
                        Text("Biometric Authentication")
                            .font(theme.bodyFont)
                            .foregroundColor(theme.textPrimary)
                    }
                }
                .disabled(viewModel.state == .loading)
                .toggleStyle(SwitchToggleStyle(tint: theme.primary))
                
                Text("Enable Face ID/Touch ID for secure and quick access to your account")
                    .font(theme.captionFont)
                    .foregroundColor(theme.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityHint("Toggle switch to enable or disable biometric authentication")
            }
            .padding(.vertical, 8)
            .frame(minHeight: 44)
        } header: {
            Text("Security")
                .font(theme.headingFont)
                .foregroundColor(theme.textPrimary)
                .textCase(nil)
                .accessibilityAddTraits(.isHeader)
        }
    }
    
    private func notificationSection() -> some View {
        Section {
            VStack(alignment: .leading, spacing: theme.spacing) {
                Toggle(isOn: Binding(
                    get: { viewModel.isNotificationsEnabled },
                    set: { _ in viewModel.toggleNotifications() }
                )) {
                    HStack {
                        Image(systemName: "bell.fill")
                            .foregroundColor(theme.primary)
                            .accessibility(hidden: true)
                        
                        Text("Push Notifications")
                            .font(theme.bodyFont)
                            .foregroundColor(theme.textPrimary)
                    }
                }
                .disabled(viewModel.state == .loading)
                .toggleStyle(SwitchToggleStyle(tint: theme.primary))
                
                Text("Receive important updates about your accounts, transactions, and budgets")
                    .font(theme.captionFont)
                    .foregroundColor(theme.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityHint("Toggle switch to enable or disable push notifications")
            }
            .padding(.vertical, 8)
            .frame(minHeight: 44)
        } header: {
            Text("Notifications")
                .font(theme.headingFont)
                .foregroundColor(theme.textPrimary)
                .textCase(nil)
                .accessibilityAddTraits(.isHeader)
        }
    }
    
    private func aboutSection() -> some View {
        Section {
            VStack(alignment: .leading, spacing: theme.spacing) {
                HStack {
                    Text("Version")
                        .font(theme.bodyFont)
                        .foregroundColor(theme.textPrimary)
                    
                    Spacer()
                    
                    Text(Bundle.main.appVersion)
                        .font(.system(.body, design: .monospaced))
                        .foregroundColor(theme.textSecondary)
                }
                .frame(minHeight: 44)
                .accessibilityElement(children: .combine)
                
                CustomButton(
                    title: "Privacy Policy",
                    style: .outline
                ) {
                    if let url = URL(string: "https://mintreplica.com/privacy") {
                        UIApplication.shared.open(url)
                    }
                }
                .accessibilityHint("Opens privacy policy in external browser")
                
                CustomButton(
                    title: "Terms of Service",
                    style: .outline
                ) {
                    if let url = URL(string: "https://mintreplica.com/terms") {
                        UIApplication.shared.open(url)
                    }
                }
                .accessibilityHint("Opens terms of service in external browser")
                
                CustomButton(
                    title: "Support",
                    style: .outline
                ) {
                    if let url = URL(string: "https://mintreplica.com/support") {
                        UIApplication.shared.open(url)
                    }
                }
                .accessibilityHint("Opens support page in external browser")
            }
            .padding(.vertical, 8)
        } header: {
            Text("About")
                .font(theme.headingFont)
                .foregroundColor(theme.textPrimary)
                .textCase(nil)
                .accessibilityAddTraits(.isHeader)
        }
    }
}

// MARK: - Error Alert Model
private struct ErrorAlert: Identifiable {
    let id = UUID()
    let message: String
}

// MARK: - Bundle Extension
private extension Bundle {
    var appVersion: String {
        return "\(infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0").\(infoDictionary?["CFBundleVersion"] as? String ?? "0")"
    }
}

// MARK: - Preview Provider
#if DEBUG
struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            SettingsView()
                .preferredColorScheme(.light)
            
            SettingsView()
                .preferredColorScheme(.dark)
            
            SettingsView()
                .environment(\.sizeCategory, .accessibilityExtraExtraExtraLarge)
        }
    }
}
#endif