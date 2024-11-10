// Third-party imports
// @vite/client v4.0.0 - Required for importing SVG and PNG assets
/// <reference types="vite/client" />

/**
 * HUMAN TASKS:
 * 1. Ensure all SVG and PNG assets are placed in their respective theme folders:
 *    - /assets/images/light/
 *    - /assets/images/dark/
 * 2. Verify that all images meet WCAG 2.1 contrast requirements for accessibility
 * 3. Optimize all images for web performance using appropriate compression tools
 */

// Requirement: Technical Specification/8.1 User Interface Design
// Application logos for light and dark themes
export const logoLight = new URL('./light/logo.svg', import.meta.url).href;
export const logoDark = new URL('./dark/logo.svg', import.meta.url).href;

// Requirement: Technical Specification/8.1.1 Design System Key
// Account type specific icons
export const accountIcons = {
  checking: new URL('./light/accounts/checking.svg', import.meta.url).href,
  savings: new URL('./light/accounts/savings.svg', import.meta.url).href,
  credit: new URL('./light/accounts/credit.svg', import.meta.url).href,
  investment: new URL('./light/accounts/investment.svg', import.meta.url).href,
} as const;

// Transaction category specific icons
export const categoryIcons = {
  income: new URL('./light/categories/income.svg', import.meta.url).href,
  shopping: new URL('./light/categories/shopping.svg', import.meta.url).href,
  groceries: new URL('./light/categories/groceries.svg', import.meta.url).href,
  transport: new URL('./light/categories/transport.svg', import.meta.url).href,
  utilities: new URL('./light/categories/utilities.svg', import.meta.url).href,
  entertainment: new URL('./light/categories/entertainment.svg', import.meta.url).href,
  healthcare: new URL('./light/categories/healthcare.svg', import.meta.url).href,
  other: new URL('./light/categories/other.svg', import.meta.url).href,
} as const;

// Navigation menu icons
export const navigationIcons = {
  dashboard: new URL('./light/navigation/dashboard.svg', import.meta.url).href,
  accounts: new URL('./light/navigation/accounts.svg', import.meta.url).href,
  transactions: new URL('./light/navigation/transactions.svg', import.meta.url).href,
  budgets: new URL('./light/navigation/budgets.svg', import.meta.url).href,
  goals: new URL('./light/navigation/goals.svg', import.meta.url).href,
  investments: new URL('./light/navigation/investments.svg', import.meta.url).href,
  settings: new URL('./light/navigation/settings.svg', import.meta.url).href,
} as const;

// Action and interaction icons
export const actionIcons = {
  add: new URL('./light/actions/add.svg', import.meta.url).href,
  edit: new URL('./light/actions/edit.svg', import.meta.url).href,
  delete: new URL('./light/actions/delete.svg', import.meta.url).href,
  sync: new URL('./light/actions/sync.svg', import.meta.url).href,
  filter: new URL('./light/actions/filter.svg', import.meta.url).href,
  sort: new URL('./light/actions/sort.svg', import.meta.url).href,
  search: new URL('./light/actions/search.svg', import.meta.url).href,
  notification: new URL('./light/actions/notification.svg', import.meta.url).href,
} as const;

// Illustration images for application states
export const illustrationImages = {
  emptyState: new URL('./light/illustrations/empty-state.svg', import.meta.url).href,
  error: new URL('./light/illustrations/error.svg', import.meta.url).href,
  success: new URL('./light/illustrations/success.svg', import.meta.url).href,
  loading: new URL('./light/illustrations/loading.svg', import.meta.url).href,
} as const;