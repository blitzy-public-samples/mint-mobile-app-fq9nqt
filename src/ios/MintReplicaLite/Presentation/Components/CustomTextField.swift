// SwiftUI framework - iOS 14.0+
import SwiftUI
// Combine framework - iOS 14.0+
import Combine

// MARK: - Human Tasks
/*
1. Verify accessibility labels are properly localized
2. Test VoiceOver functionality with error states
3. Verify dynamic type scaling works correctly
4. Test keyboard handling with different input types
5. Verify secure text entry works with password managers
*/

/// A customizable text field component with built-in validation, formatting support, and accessibility features
/// Implements requirements from Mobile Applications Design and User Interface Design
@frozen public struct CustomTextField: View {
    // MARK: - Properties
    @Binding private var text: String
    private let placeholder: String
    private let title: String?
    @State private var errorMessage: String?
    private let isSecure: Bool
    private let contentType: UITextContentType?
    private let autocapitalization: TextInputAutocapitalization
    private let keyboardType: UIKeyboardType
    @State private var isValid: Bool = true
    @FocusState private var isFirstResponder: Bool
    private let minHeight: CGFloat = 44 // Minimum touch target size for accessibility
    
    // MARK: - Theme Properties
    private let theme = AppTheme.shared
    
    // MARK: - Initialization
    /// Initializes a custom text field with specified configuration and accessibility support
    /// - Parameters:
    ///   - text: Binding to the text value
    ///   - placeholder: Placeholder text
    ///   - title: Optional title text above the field
    ///   - isSecure: Whether the field should use secure text entry
    ///   - contentType: UITextContentType for input suggestions
    ///   - keyboardType: Keyboard type for input
    public init(
        text: Binding<String>,
        placeholder: String,
        title: String? = nil,
        isSecure: Bool = false,
        contentType: UITextContentType? = nil,
        keyboardType: UIKeyboardType = .default
    ) {
        self._text = text
        self.placeholder = placeholder
        self.title = title
        self.isSecure = isSecure
        self.contentType = contentType
        self.keyboardType = keyboardType
        self.autocapitalization = contentType == .emailAddress ? .never : .sentences
    }
    
    // MARK: - Body
    public var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Optional title
            if let title = title {
                Text(title)
                    .font(theme.configureTextStyle(size: 14, weight: .medium))
                    .foregroundColor(theme.textSecondary)
                    .accessibility(traits: .isHeader)
            }
            
            // Text field container
            HStack(spacing: 8) {
                // Main text input
                Group {
                    if isSecure {
                        SecureField(placeholder, text: $text)
                    } else {
                        TextField(placeholder, text: $text)
                    }
                }
                .textContentType(contentType)
                .keyboardType(keyboardType)
                .textInputAutocapitalization(autocapitalization)
                .focused($isFirstResponder)
                .onChange(of: text) { _ in
                    formatText()
                }
                
                // Clear button
                if !text.isEmpty {
                    Button(action: {
                        text = ""
                        isValid = true
                        errorMessage = nil
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(theme.textSecondary)
                            .accessibility(label: Text("Clear text"))
                    }
                }
            }
            .frame(minHeight: minHeight)
            .padding(.horizontal, 12)
            .background(theme.surface)
            .cornerRadius(theme.cornerRadius)
            .overlay(
                RoundedRectangle(cornerRadius: theme.cornerRadius)
                    .stroke(borderColor, lineWidth: 1)
            )
            
            // Error message
            if let error = errorMessage {
                Text(error)
                    .font(theme.configureTextStyle(size: 12, weight: .regular))
                    .foregroundColor(theme.error)
                    .accessibility(traits: .isStaticText)
            }
        }
        .makeAccessible()
    }
    
    // MARK: - Private Properties
    private var borderColor: Color {
        if !isValid {
            return theme.error
        }
        return isFirstResponder ? theme.primary : theme.textSecondary.opacity(0.3)
    }
    
    // MARK: - Validation
    /// Validates text input based on content type and requirements
    /// - Returns: Boolean indicating if the input is valid
    private func validate() -> Bool {
        guard !text.isEmpty else {
            errorMessage = "This field is required"
            return false
        }
        
        if let contentType = contentType {
            switch contentType {
            case .emailAddress:
                let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
                let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
                if !emailPredicate.evaluate(with: text) {
                    errorMessage = "Please enter a valid email address"
                    return false
                }
            case .password:
                if text.count < 8 {
                    errorMessage = "Password must be at least 8 characters"
                    return false
                }
            default:
                break
            }
        }
        
        errorMessage = nil
        return true
    }
    
    // MARK: - Text Formatting
    /// Formats text input based on content type with accessibility considerations
    private func formatText() {
        // Remove leading/trailing whitespace
        text = text.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Format based on content type
        if let contentType = contentType {
            switch contentType {
            case .emailAddress:
                text = text.lowercased()
            case .telephoneNumber:
                // Format phone numbers as (XXX) XXX-XXXX
                let digits = text.filter { $0.isNumber }
                if digits.count > 10 {
                    text = String(digits.prefix(10))
                }
                if digits.count == 10 {
                    let area = digits.prefix(3)
                    let prefix = digits.dropFirst(3).prefix(3)
                    let number = digits.dropFirst(6)
                    text = "(\(area)) \(prefix)-\(number)"
                }
            default:
                break
            }
        }
        
        isValid = validate()
    }
}

// MARK: - Accessibility Extension
private extension CustomTextField {
    /// Configures accessibility properties for the text field
    func makeAccessible() -> some View {
        self
            .accessibilityElement(children: .combine)
            .accessibility(label: Text(title ?? placeholder))
            .accessibility(value: Text(text.isEmpty ? "Empty" : text))
            .accessibility(hint: Text(placeholder))
            .accessibility(addTraits: .isSearchField)
            .accessibility(removeTraits: .isImage)
            .accessibilityAction(.escape) {
                isFirstResponder = false
            }
            .onChange(of: errorMessage) { newError in
                if let error = newError {
                    UIAccessibility.post(notification: .announcement, argument: error)
                }
            }
    }
}

// MARK: - Requirements Implementation Comments
/*
 Requirement: Mobile Applications Design (5.2.1)
 Implementation: Implements native iOS text input component using SwiftUI
 
 Requirement: User Interface Design (8.1.1)
 Implementation: Provides consistent text input styling across the application using AppTheme
 
 Requirement: Accessibility Features (8.1.8)
 Implementation: Implements accessibility labels, hints, actions, and dynamic type support
*/