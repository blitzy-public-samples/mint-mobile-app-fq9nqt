// React v18.0.0
import React, { useCallback, useEffect, useRef, KeyboardEvent } from 'react';
import { primary, neutral } from '../../config/theme.config';

// HUMAN TASKS:
// 1. Verify tab component meets WCAG 2.1 touch target size requirements (44x44px)
// 2. Test keyboard navigation with screen readers
// 3. Validate color contrast ratios in high contrast mode
// 4. Test responsive behavior across different device sizes

// Type Definitions
export type TabOrientation = 'horizontal' | 'vertical';

export interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface TabProps {
  id: string;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  ariaControls: string;
  ariaLabel?: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  orientation?: TabOrientation;
  ariaLabel?: string;
}

// TabButton Component
const TabButton: React.FC<TabProps> = ({
  id,
  label,
  active,
  disabled,
  onClick,
  ariaControls,
  ariaLabel,
}) => {
  // Requirement: Accessibility Features - Minimum touch target size
  const buttonStyles: React.CSSProperties = {
    minWidth: '44px',
    minHeight: '44px',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: active ? primary[500] : 'transparent',
    color: active ? '#ffffff' : neutral[700],
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s ease-in-out',
    fontSize: '1rem',
    fontWeight: active ? '600' : '400',
    position: 'relative',
    outline: 'none',
  };

  // Requirement: Accessibility Features - Keyboard interaction handlers
  const handleKeyPress = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <button
      role="tab"
      id={`tab-${id}`}
      aria-selected={active}
      aria-controls={ariaControls}
      aria-label={ariaLabel || label}
      aria-disabled={disabled}
      tabIndex={active ? 0 : -1}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyPress}
      style={buttonStyles}
      data-active={active}
      data-disabled={disabled}
    >
      {label}
    </button>
  );
};

// Main Tabs Component
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  className = '',
  orientation = 'horizontal',
  ariaLabel = 'Navigation Tabs',
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);

  // Requirement: Mobile-First Design - Responsive container styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    gap: '8px',
    padding: '4px',
    borderRadius: '8px',
    backgroundColor: neutral[100],
    '@media (max-width: 640px)': {
      flexDirection: 'column',
      width: '100%',
    },
  };

  // Requirement: Accessibility Features - Keyboard navigation
  const handleKeyNavigation = useCallback((event: KeyboardEvent) => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex + 1;
        if (nextIndex >= tabs.length) nextIndex = 0;
        while (nextIndex !== currentIndex && tabs[nextIndex].disabled) {
          nextIndex = nextIndex + 1 >= tabs.length ? 0 : nextIndex + 1;
        }
        if (!tabs[nextIndex].disabled) onTabChange(tabs[nextIndex].id);
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) nextIndex = tabs.length - 1;
        while (nextIndex !== currentIndex && tabs[nextIndex].disabled) {
          nextIndex = nextIndex - 1 < 0 ? tabs.length - 1 : nextIndex - 1;
        }
        if (!tabs[nextIndex].disabled) onTabChange(tabs[nextIndex].id);
        break;

      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        while (nextIndex < tabs.length && tabs[nextIndex].disabled) {
          nextIndex++;
        }
        if (nextIndex < tabs.length) onTabChange(tabs[nextIndex].id);
        break;

      case 'End':
        event.preventDefault();
        nextIndex = tabs.length - 1;
        while (nextIndex >= 0 && tabs[nextIndex].disabled) {
          nextIndex--;
        }
        if (nextIndex >= 0) onTabChange(tabs[nextIndex].id);
        break;
    }
  }, [tabs, activeTabId, onTabChange]);

  useEffect(() => {
    const tabList = tabListRef.current;
    if (!tabList) return;

    // Add keyboard event listeners
    tabList.addEventListener('keydown', handleKeyNavigation as any);
    return () => {
      tabList.removeEventListener('keydown', handleKeyNavigation as any);
    };
  }, [handleKeyNavigation]);

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={orientation}
      className={className}
      style={containerStyles}
    >
      {tabs.map(tab => (
        <TabButton
          key={tab.id}
          id={tab.id}
          label={tab.label}
          active={activeTabId === tab.id}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          ariaControls={`tabpanel-${tab.id}`}
          ariaLabel={tab.ariaLabel}
        />
      ))}
    </div>
  );
};

// Export named components and types
export default Tabs;