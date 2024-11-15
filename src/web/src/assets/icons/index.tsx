// React v18.0.0
import { FC, SVGProps } from 'react';

// Human Tasks:
// 1. Ensure all SVG icon files are placed in the icons directory
// 2. Verify that all SVG files follow accessibility guidelines (proper titles, descriptions)
// 3. Confirm touch target sizes in mobile testing (44x44px minimum)

// Addresses Technical Specification/8.1 User Interface Design
// Implements standardized icon system for consistent UI elements

// Icon size constants following design system
export const ICON_SIZES = {
  SM: '16',
  MD: '24',
  LG: '32',
  XL: '48'
} as const;

// Default icon properties for consistent rendering
export const DEFAULT_ICON_PROPS = {
  size: '24',
  color: 'currentColor',
  role: 'img',
  focusable: false
} as const;

// Common interface for all icon components
// Addresses Technical Specification/8.1.8 Accessibility Features
export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | keyof typeof ICON_SIZES;
  color?: string;
  className?: string;
  ariaLabel?: string;
  role?: string;
  focusable?: boolean;
}

// Type definition for icon properties
export type IconType = {
  size?: IconProps['size'];
  color?: IconProps['color'];
};// Utility function to resolve icon size
// Ensures minimum touch target size of 44px for interactive icons
export const getIconSize = (size?: IconProps['size']): number => {
  if (!size) return Number(DEFAULT_ICON_PROPS.size);

  if (typeof size === 'string' && size in ICON_SIZES) {
    return Number(ICON_SIZES[size as keyof typeof ICON_SIZES]);
  }

  const numericSize = Number(size);
  // Enforce minimum touch target size of 44px for interactive elements
  return numericSize >= 44 ? numericSize : Number(DEFAULT_ICON_PROPS.size);
};

export const DashboardIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4 5C4 4.44772 4.44772 4 5 4H9C9.55228 4 10 4.44772 10 5V9C10 9.55228 9.55228 10 9 10H5C4.44772 10 4 9.55228 4 9V5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round" />
    <path
      d="M14 5C14 4.44772 14.4477 4 15 4H19C19.5523 4 20 4.44772 20 5V9C20 9.55228 19.5523 10 19 10H15C14.4477 10 14 9.55228 14 9V5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round" />
    <path
      d="M4 15C4 14.4477 4.44772 14 5 14H9C9.55228 14 10 14.4477 10 15V19C10 19.5523 9.55228 20 9 20H5C4.44772 20 4 19.5523 4 19V15Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round" />
    <path
      d="M14 15C14 14.4477 14.4477 14 15 14H19C19.5523 14 20 14.4477 20 15V19C20 19.5523 19.5523 20 19 20H15C14.4477 20 14 19.5523 14 19V15Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round" />
  </svg>
);

export const LogoutIcon: FC<IconProps> = ({
  size,
  color = DEFAULT_ICON_PROPS.color,
  role = DEFAULT_ICON_PROPS.role,
  focusable = DEFAULT_ICON_PROPS.focusable,
  ariaLabel = 'Logout',
  ...props
}) => (
  <svg
    width={getIconSize(size)}
    height={getIconSize(size)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    role={role}
    focusable={focusable}
    aria-label={ariaLabel}
    {...props}
  >
    <path
      d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Addresses Technical Specification/8.1.1 Design System Key
// Financial Icons
export const AccountIcon: FC<IconProps> = ({
  size,
  color = DEFAULT_ICON_PROPS.color,
  role = DEFAULT_ICON_PROPS.role,
  focusable = DEFAULT_ICON_PROPS.focusable,
  ariaLabel = 'Account',
  ...props
}) => (<svg
  width={getIconSize(size)}
  height={getIconSize(size)}
  viewBox="0 0 24 24"
  fill="none"
  stroke={color}
  role={role}
  focusable={focusable}
  aria-label={ariaLabel}
  {...props}
>
  <path
    d="M3 9h18M3 15h18"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round" />
</svg>)

export const BudgetIcon: FC<IconProps> = ({
  size,
  color = DEFAULT_ICON_PROPS.color,
  role = DEFAULT_ICON_PROPS.role,
  focusable = DEFAULT_ICON_PROPS.focusable,
  ariaLabel = 'Budget',
  ...props
}) => (
  <svg
    width={getIconSize(size)}
    height={getIconSize(size)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    role={role}
    focusable={focusable}
    aria-label={ariaLabel}
    {...props}
  >
    <path
      d="M4 4h16v16H4V4z M8 12h8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TransactionIcon: FC<IconProps> = ({
  size,
  color = DEFAULT_ICON_PROPS.color,
  role = DEFAULT_ICON_PROPS.role,
  focusable = DEFAULT_ICON_PROPS.focusable,
  ariaLabel = 'Transaction',
  ...props
}) => (
  <svg
    width={getIconSize(size)}
    height={getIconSize(size)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    role={role}
    focusable={focusable}
    aria-label={ariaLabel}
    {...props}
  >
    <path
      d="M12 4v16M4 12h16"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const InvestmentIcon: FC<IconProps> = ({
  size,
  color = DEFAULT_ICON_PROPS.color,
  role = DEFAULT_ICON_PROPS.role,
  focusable = DEFAULT_ICON_PROPS.focusable,
  ariaLabel = 'Investment',
  ...props
}) => (
  <svg
    width={getIconSize(size)}
    height={getIconSize(size)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    role={role}
    focusable={focusable}
    aria-label={ariaLabel}
    {...props}
  >
    <path
      d="M4 20l6-6 4 4 6-6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GoalIcon: FC<IconProps> = ({
  size,
  color = DEFAULT_ICON_PROPS.color,
  role = DEFAULT_ICON_PROPS.role,
  focusable = DEFAULT_ICON_PROPS.focusable,
  ariaLabel = 'Goal',
  ...props
}) => (
  <svg
    width={getIconSize(size)}
    height={getIconSize(size)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    role={role}
    focusable={focusable}
    aria-label={ariaLabel}
    {...props}
  >
    <path
      d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const NavigationIcon: FC<IconProps> = ({
  size,
  color = DEFAULT_ICON_PROPS.color,
  role = DEFAULT_ICON_PROPS.role,
  focusable = DEFAULT_ICON_PROPS.focusable,
  ariaLabel = 'Navigation',
  ...props
}) => (
  <svg
    width={getIconSize(size)}
    height={getIconSize(size)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    role={role}
    focusable={focusable}
    aria-label={ariaLabel}
    {...props}
  >
    <path
      d="M15 18l-6-6 6-6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const StatusIcon: FC<IconProps> = ({
  size,
  color = DEFAULT_ICON_PROPS.color,
  role = DEFAULT_ICON_PROPS.role,
  focusable = DEFAULT_ICON_PROPS.focusable,
  ariaLabel = 'Status',
  ...props
}) => (
  <svg
    width={getIconSize(size)}
    height={getIconSize(size)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    role={role}
    focusable={focusable}
    aria-label={ariaLabel}
    {...props}
  >
    <path
      d="M12 8v8M12 16h.01"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ActionIcon: FC<IconProps> = ({
  size,
  color = DEFAULT_ICON_PROPS.color,
  role = DEFAULT_ICON_PROPS.role,
  focusable = DEFAULT_ICON_PROPS.focusable,
  ariaLabel = 'Action',
  ...props
}) => (
  <svg
    width={getIconSize(size)}
    height={getIconSize(size)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    role={role}
    focusable={focusable}
    aria-label={ariaLabel}
    {...props}
  >
    <path
      d="M12 4v16M4 12h16"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
