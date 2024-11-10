// Third-party imports
// @version: react ^18.0.0
import React, { useState, useEffect, useRef } from 'react';

// Internal imports
import { DropdownProps } from '../../types/components.types';

/**
 * Custom hook to handle clicks outside of the dropdown menu
 * @param ref - Reference to the dropdown container
 * @param handler - Function to call when click is detected outside
 */
const useClickOutside = (ref: React.RefObject<HTMLDivElement>, handler: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, handler]);
};

/**
 * Dropdown component that provides a customizable select menu with accessibility support
 * Addresses requirements:
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 * - Mobile Responsive Considerations (Technical Specification/8.1.7 Mobile Responsive Considerations)
 */
const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  searchable = false,
  error,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the dropdown
  useClickOutside(dropdownRef, () => setIsOpen(false));

  // Reset search value when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchValue('');
      setActiveIndex(-1);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const filteredOptions = options.filter(option =>
    searchable
      ? option.label.toLowerCase().includes(searchValue.toLowerCase())
      : true
  );

  const selectedOption = options.find(option => option.value === value);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
        if (isOpen && activeIndex >= 0) {
          handleOptionSelect(filteredOptions[activeIndex].value);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setActiveIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        }
        break;
    }
  };

  // Scroll active option into view
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && optionsRef.current) {
      const activeOption = optionsRef.current.children[activeIndex] as HTMLElement;
      if (activeOption) {
        activeOption.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [activeIndex, isOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`dropdown ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={`dropdown-trigger ${error ? 'border-red-500' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={ariaLabel}
        aria-invalid={!!error}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {isOpen && (
        <div className="dropdown-menu" role="listbox">
          {searchable && (
            <div className="dropdown-search">
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search..."
                className="w-full border-none focus:ring-2 focus:ring-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div ref={optionsRef} className="py-1">
            {filteredOptions.map((option, index) => (
              <div
                key={option.value}
                className={`dropdown-option ${
                  option.value === value ? 'bg-primary-50 text-primary-700' : ''
                } ${activeIndex === index ? 'bg-neutral-100' : ''}`}
                onClick={() => handleOptionSelect(option.value)}
                role="option"
                aria-selected={option.value === value}
                tabIndex={0}
              >
                {option.label}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-500">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;