/**
 * Human Tasks:
 * 1. Verify WCAG 2.1 color contrast ratios in theme configuration
 * 2. Test form submission with screen readers
 * 3. Validate keyboard navigation flow
 * 4. Confirm error messages are properly announced by screen readers
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useEffect } from 'react';
// @version: react-hook-form ^7.0.0
import { useForm, Controller } from 'react-hook-form';

// Internal imports
import { Transaction } from '../../types/models.types';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { formatCurrency, parseCurrencyString } from '../../utils/currency.utils';

/**
 * Props interface for TransactionForm component
 * Addresses requirement: Transaction Management (Technical Specification/1.2 Scope/Core Features)
 */
interface TransactionFormProps {
  initialData?: Transaction;
  onSubmit: (transaction: Transaction) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Form data structure for transaction input
 * Addresses requirement: Data Input (Technical Specification/8.1 User Interface Design)
 */
interface TransactionFormData {
  description: string;
  amount: number;
  categoryId: string;
  date: Date;
  metadata: Record<string, any>;
}

/**
 * Transaction form component with validation and accessibility features
 * Addresses requirements:
 * - Transaction Management (Technical Specification/1.2 Scope/Core Features)
 * - Data Input (Technical Specification/8.1 User Interface Design)
 * - Accessibility (Technical Specification/8.1.8 Accessibility Features)
 */
export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue
  } = useForm<TransactionFormData>({
    defaultValues: {
      description: initialData?.description || '',
      amount: initialData?.amount || 0,
      categoryId: initialData?.categoryId || '',
      date: initialData?.date || new Date(),
      metadata: initialData?.metadata || {}
    }
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        description: initialData.description,
        amount: initialData.amount,
        categoryId: initialData.categoryId,
        date: initialData.date,
        metadata: initialData.metadata
      });
    }
  }, [initialData, reset]);

  /**
   * Validates transaction amount input
   * @param value - Amount string to validate
   * @returns True if valid, error message if invalid
   */
  const validateAmount = (value: string): boolean | string => {
    const numericValue = parseCurrencyString(value);
    if (!value) {
      return 'Amount is required';
    }
    if (isNaN(numericValue)) {
      return 'Please enter a valid amount';
    }
    if (numericValue <= 0) {
      return 'Amount must be greater than zero';
    }
    return true;
  };

  /**
   * Handles amount input changes with currency formatting
   * @param value - Raw amount input value
   * @param onChange - Form field onChange handler
   */
  const handleAmountChange = (value: string, onChange: (value: number) => void) => {
    const numericValue = parseCurrencyString(value);
    if (!isNaN(numericValue)) {
      onChange(numericValue);
      setValue('amount', numericValue);
    }
  };

  /**
   * Handles form submission with validation
   * @param data - Form data to be submitted
   */
  const onFormSubmit = handleSubmit((data: TransactionFormData) => {
    const transaction: Transaction = {
      id: initialData?.id || '', // New transactions will get ID from backend
      accountId: initialData?.accountId || '', // This should be set by parent component
      ...data,
      amount: parseCurrencyString(data.amount.toString()),
      pending: false
    };
    onSubmit(transaction);
  });

  return (
    <form 
      onSubmit={onFormSubmit}
      className="transaction-form"
      aria-label="Transaction form"
      noValidate
    >
      <div className="form-grid">
        <Controller
          name="description"
          control={control}
          rules={{ 
            required: 'Description is required',
            maxLength: {
              value: 100,
              message: 'Description must be less than 100 characters'
            }
          }}
          render={({ field }) => (
            <Input
              type="text"
              label="Description"
              required
              error={errors.description?.message}
              {...field}
            />
          )}
        />

        <Controller
          name="amount"
          control={control}
          rules={{
            validate: validateAmount
          }}
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              type="text"
              label="Amount"
              required
              value={formatCurrency(value)}
              onChange={(val) => handleAmountChange(val, onChange)}
              error={errors.amount?.message}
              {...field}
            />
          )}
        />

        <Controller
          name="categoryId"
          control={control}
          rules={{ required: 'Category is required' }}
          render={({ field }) => (
            <Input
              type="text"
              label="Category"
              required
              error={errors.categoryId?.message}
              {...field}
            />
          )}
        />

        <Controller
          name="date"
          control={control}
          rules={{ required: 'Date is required' }}
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              type="date"
              label="Date"
              required
              value={value instanceof Date ? value.toISOString().split('T')[0] : value}
              onChange={(val) => onChange(new Date(val))}
              error={errors.date?.message}
              {...field}
            />
          )}
        />
      </div>

      <div className="form-actions">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Cancel transaction"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
          aria-label="Save transaction"
        >
          {initialData ? 'Update' : 'Create'} Transaction
        </Button>
      </div>

      <style jsx>{`
        .transaction-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }

        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
  );
};

export default TransactionForm;