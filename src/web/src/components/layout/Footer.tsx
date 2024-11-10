// @ts-check
import React from 'react'; // ^18.0.0
import { colors, spacing, typography } from '../../config/theme.config';
import '../../styles/layout.css';

/**
 * HUMAN TASKS:
 * 1. Verify WCAG compliance with automated accessibility testing tools
 * 2. Test responsive behavior across all breakpoints (320px to 2048px)
 * 3. Validate high contrast mode appearance
 * 4. Test keyboard navigation through footer links
 */

/**
 * Footer component that provides consistent layout and navigation across the application
 * Requirements addressed:
 * - Mobile-First Design (Technical Specification/1.1 System Overview)
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // Navigation links with proper ARIA labels
  const navigationLinks = [
    { label: 'About Us', href: '/about', ariaLabel: 'Learn more about Mint Replica Lite' },
    { label: 'Privacy Policy', href: '/privacy', ariaLabel: 'Read our privacy policy' },
    { label: 'Terms of Service', href: '/terms', ariaLabel: 'View our terms of service' },
    { label: 'Contact', href: '/contact', ariaLabel: 'Contact our support team' },
  ];

  return (
    <footer
      className="container"
      role="contentinfo"
      style={{
        backgroundColor: colors.neutral[50],
        borderTop: `1px solid ${colors.neutral[200]}`,
        padding: `${spacing.values[6]} 0`,
        marginTop: 'auto'
      }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between">
        {/* Navigation Section */}
        <nav
          aria-label="Footer Navigation"
          className="flex flex-wrap justify-center md:justify-start"
          style={{ marginBottom: spacing.values[4] }}
        >
          <ul
            className="flex flex-wrap items-center"
            style={{ gap: spacing.values[6] }}
          >
            {navigationLinks.map(({ label, href, ariaLabel }) => (
              <li key={href}>
                <a
                  href={href}
                  aria-label={ariaLabel}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500"
                  style={{
                    color: colors.neutral[700],
                    fontSize: typography.fontSize.md,
                    fontWeight: typography.fontWeight.medium,
                    padding: spacing.values[2],
                    borderRadius: '4px',
                    transition: 'color 0.2s ease'
                  }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Copyright Section */}
        <div
          className="text-center md:text-right"
          style={{
            color: colors.neutral[600],
            fontSize: typography.fontSize.sm
          }}
        >
          <p>
            <span aria-label="Copyright">©</span>{' '}
            {currentYear} Mint Replica Lite.{' '}
            <span>All rights reserved.</span>
          </p>
        </div>
      </div>

      {/* Accessibility Features */}
      <div className="sr-only" aria-live="polite">
        <h2>Footer Navigation</h2>
        <p>You are currently in the footer section of the website.</p>
      </div>
    </footer>
  );
};

export default Footer;