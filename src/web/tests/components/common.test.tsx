// Third-party imports
// @version: react ^18.0.0
import React from 'react';
// @version: @testing-library/react ^13.0.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// @version: @testing-library/jest-dom ^5.16.0
import '@testing-library/jest-dom';
// @version: @testing-library/user-event ^14.0.0
import userEvent from '@testing-library/user-event';

// Internal imports
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { Input } from '../../src/components/common/Input';

/**
 * Test suite for Button component
 * Addresses requirements:
 * - User Interface Design (8.1.1 Design System)
 * - Accessibility Features (8.1.8 WCAG Compliance)
 * - Mobile Responsive (8.1.7 Touch Targets)
 */
describe('Button Component Tests', () => {
  // Render tests
  test('renders with default props and correct class names', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
    expect(button).not.toBeDisabled();
  });

  // Variant tests
  test('applies correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-500');

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-neutral-100');

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('border-2', 'border-primary-500');
  });

  // Size tests
  test('handles different sizes with proper dimensions', () => {
    const { rerender } = render(<Button size="small">Small</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-2', 'text-sm');

    rerender(<Button size="medium">Medium</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'text-base');

    rerender(<Button size="large">Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  // Disabled state tests
  test('disables correctly with aria-disabled attribute', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  // Loading state tests
  test('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button');
    const spinner = button.querySelector('.animate-spin');
    
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(spinner).toBeInTheDocument();
    expect(button).toHaveClass('!text-transparent');
  });

  // Click handler tests
  test('handles click events when not disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Keyboard navigation tests
  test('supports keyboard navigation with Tab, Enter, Space', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Keyboard</Button>);
    const button = screen.getByRole('button');
    
    // Tab navigation
    expect(document.body).toHaveFocus();
    userEvent.tab();
    expect(button).toHaveFocus();
    
    // Enter key
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Space key
    await userEvent.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  // Touch target size tests
  test('maintains minimum touch target size of 44x44 points', () => {
    render(<Button>Touch Target</Button>);
    const button = screen.getByRole('button');
    
    const styles = window.getComputedStyle(button);
    expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
  });
});

/**
 * Test suite for Card component
 * Addresses requirements:
 * - User Interface Design (8.1.1 Design System)
 * - Accessibility Features (8.1.8 WCAG Compliance)
 * - Mobile Responsive (8.1.7 Responsive Layout)
 */
describe('Card Component Tests', () => {
  // Render tests
  test('renders with title in proper heading element', () => {
    render(<Card title="Test Card">Content</Card>);
    
    const card = screen.getByRole('article');
    const heading = screen.getByRole('heading', { name: /test card/i });
    
    expect(card).toBeInTheDocument();
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
  });

  // Loading state tests
  test('shows loading spinner in loading state', () => {
    render(<Card loading title="Loading Card">Content</Card>);
    
    const spinner = screen.getByRole('status');
    const content = screen.getByText('Content');
    
    expect(spinner).toBeInTheDocument();
    expect(content).toHaveStyle({ opacity: '0.5' });
  });

  // Content rendering tests
  test('renders children content correctly', () => {
    render(
      <Card title="Test Card">
        <div data-testid="child">Child Content</div>
      </Card>
    );
    
    const childContent = screen.getByTestId('child');
    expect(childContent).toBeInTheDocument();
    expect(childContent).toHaveTextContent('Child Content');
  });

  // Elevation tests
  test('applies elevated styles when elevated prop is true', () => {
    render(<Card elevated>Content</Card>);
    const card = screen.getByRole('article');
    
    expect(card).toHaveClass('card--elevated');
    expect(card).toHaveStyle({ boxShadow: expect.any(String) });
  });

  // Responsive layout tests
  test('maintains responsive layout across breakpoints', () => {
    render(<Card>Responsive Content</Card>);
    const card = screen.getByRole('article');
    
    expect(card).toHaveStyle({ width: '100%' });
    expect(card).toHaveStyle({ minHeight: '100px' });
  });

  // Accessibility tests
  test('includes proper ARIA role and attributes', () => {
    render(<Card title="Accessible Card">Content</Card>);
    const card = screen.getByRole('article');
    
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('role', 'article');
  });

  // Test ID tests
  test('applies test ID when provided', () => {
    render(<Card testId="test-card">Content</Card>);
    const card = screen.getByTestId('test-card');
    expect(card).toBeInTheDocument();
  });
});

/**
 * Test suite for Input component
 * Addresses requirements:
 * - User Interface Design (8.1.1 Design System)
 * - Accessibility Features (8.1.8 WCAG Compliance)
 * - Input Validation (9.2.1 Data Validation)
 */
describe('Input Component Tests', () => {
  // Render tests
  test('renders with label and placeholder text', () => {
    render(
      <Input
        label="Test Input"
        placeholder="Enter text"
        name="test"
        value=""
        onChange={() => {}}
      />
    );
    
    const input = screen.getByLabelText('Test Input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });

  // Value change tests
  test('handles value changes with proper event handling', async () => {
    const handleChange = jest.fn();
    render(
      <Input
        label="Test Input"
        name="test"
        value=""
        onChange={handleChange}
      />
    );
    
    const input = screen.getByLabelText('Test Input');
    await userEvent.type(input, 'test value');
    
    expect(handleChange).toHaveBeenCalledTimes(10); // One call per character
    expect(input).toHaveValue('test value');
  });

  // Email validation tests
  test('validates email input according to RFC standards', async () => {
    const handleChange = jest.fn();
    render(
      <Input
        type="email"
        label="Email"
        name="email"
        value=""
        onChange={handleChange}
        required
      />
    );
    
    const input = screen.getByLabelText('Email');
    
    // Invalid email
    await userEvent.type(input, 'invalid-email');
    fireEvent.blur(input);
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email format');
    
    // Valid email
    await userEvent.clear(input);
    await userEvent.type(input, 'test@example.com');
    fireEvent.blur(input);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // Error state tests
  test('displays error messages with proper styling', () => {
    render(
      <Input
        label="Test Input"
        name="test"
        value=""
        onChange={() => {}}
        error="Error message"
      />
    );
    
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toHaveTextContent('Error message');
    expect(errorMessage).toHaveClass('input-error');
  });

  // Required field tests
  test('indicates required fields with visual and ARIA attributes', () => {
    render(
      <Input
        label="Required Input"
        name="required"
        value=""
        onChange={() => {}}
        required
      />
    );
    
    const input = screen.getByLabelText(/Required Input/);
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  // Helper text tests
  test('shows helper text with proper association', () => {
    render(
      <Input
        label="Test Input"
        name="test"
        value=""
        onChange={() => {}}
        helperText="Helper message"
      />
    );
    
    const input = screen.getByLabelText('Test Input');
    const helperText = screen.getByText('Helper message');
    
    expect(helperText).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('helper-test'));
  });

  // Accessibility tests
  test('updates aria-invalid based on validation state', async () => {
    render(
      <Input
        type="email"
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
        required
      />
    );
    
    const input = screen.getByLabelText('Email');
    
    // Initially valid
    expect(input).toHaveAttribute('aria-invalid', 'false');
    
    // Invalid after blur with no value
    fireEvent.blur(input);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    
    // Valid after entering correct value
    await userEvent.type(input, 'test@example.com');
    fireEvent.blur(input);
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  // Touch target tests
  test('maintains proper touch target size', () => {
    render(
      <Input
        label="Test Input"
        name="test"
        value=""
        onChange={() => {}}
      />
    );
    
    const input = screen.getByLabelText('Test Input');
    const styles = window.getComputedStyle(input);
    
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
    expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
  });

  // Keyboard navigation tests
  test('supports keyboard navigation', async () => {
    render(
      <Input
        label="Test Input"
        name="test"
        value=""
        onChange={() => {}}
      />
    );
    
    const input = screen.getByLabelText('Test Input');
    
    expect(document.body).toHaveFocus();
    userEvent.tab();
    expect(input).toHaveFocus();
  });
});