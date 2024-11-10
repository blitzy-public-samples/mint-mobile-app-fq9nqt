/**
 * Human Tasks:
 * 1. Verify API endpoint configuration in environment settings
 * 2. Configure notification service for success/error messages
 * 3. Test form validation with screen readers
 * 4. Verify WCAG 2.1 compliance for form elements
 * 5. Set up error tracking service integration
 */

// Third-party imports
// @version: react ^18.2.0
import React, { useState, useEffect } from 'react';

// Internal imports
import { User } from '../../types/models.types';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Profile settings page component
 * Implements:
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 * - Authentication and Authorization (Technical Specification/9.1 Authentication and Authorization)
 * - Data Security (Technical Specification/9.2 Data Security)
 */

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  preferences: Record<string, any>;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
}

const Profile: React.FC = () => {
  const { authState, handleLogin } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    preferences: {}
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (authState.user) {
      setFormData({
        firstName: authState.user.firstName,
        lastName: authState.user.lastName,
        email: authState.user.email,
        preferences: authState.user.preferences
      });
    }
  }, [authState.user]);

  /**
   * Validate form inputs
   * Implements Technical Specification/9.2 Data Security
   */
  const validateForm = (data: ProfileFormData): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Validate first name
    if (!data.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (data.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    // Validate last name
    if (!data.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (data.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    return errors;
  };

  /**
   * Handle input field changes with validation
   * Implements Technical Specification/9.2 Data Security
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    
    // Clear validation error when user starts typing
    setValidationErrors(prev => ({
      ...prev,
      [name]: undefined
    }));

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handle form submission with validation and secure updates
   * Implements:
   * - Technical Specification/9.1 Authentication and Authorization
   * - Technical Specification/9.2 Data Security
   */
  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setUpdateSuccess(false);

    try {
      // Validate form inputs
      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setIsSubmitting(false);
        return;
      }

      // Prepare update payload
      const updatePayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        preferences: formData.preferences
      };

      // Make API call to update profile
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.accessToken}`
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();

      // Update auth context with new user data
      await handleLogin({
        email: updatedUser.email,
        accessToken: authState.accessToken!,
        user: updatedUser
      });

      setUpdateSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Profile update failed:', error);
      setValidationErrors({
        email: 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-settings" role="main">
      <h1 className="profile-settings__title">Profile Settings</h1>
      
      {updateSuccess && (
        <div 
          className="profile-settings__success" 
          role="alert"
          aria-live="polite"
        >
          Profile updated successfully!
        </div>
      )}

      <form 
        onSubmit={handleSubmit}
        className="profile-settings__form"
        noValidate
      >
        <Input
          type="text"
          name="firstName"
          label="First Name"
          value={formData.firstName}
          onChange={handleInputChange}
          error={validationErrors.firstName}
          required
          disabled={isSubmitting}
        />

        <Input
          type="text"
          name="lastName"
          label="Last Name"
          value={formData.lastName}
          onChange={handleInputChange}
          error={validationErrors.lastName}
          required
          disabled={isSubmitting}
        />

        <Input
          type="email"
          name="email"
          label="Email Address"
          value={formData.email}
          onChange={handleInputChange}
          error={validationErrors.email}
          required
          disabled={isSubmitting}
        />

        <button
          type="submit"
          className="profile-settings__submit-btn"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default Profile;