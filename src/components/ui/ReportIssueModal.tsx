import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { Dropdown } from './Dropdown';
import C2AButton from '../C2AButton';

type ReportIssueModalProps = {
  open: boolean;
  onClose: () => void;
};

interface Category {
  _id: string;
  label: string;
  description: string;
  isActive: boolean;
}

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ open, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [autoCloseTimeout, setAutoCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ category?: string; message?: string }>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedCategory('');
      setMessage('');
      setShowSuccess(false);
      setErrors({});
      setIsSubmitting(false);
      setCategoriesError(null);
    }
  }, [open]);

  // Fetch categories when modal opens
  useEffect(() => {
    if (open) {
      const fetchCategories = async () => {
        setLoadingCategories(true);
        setCategoriesError(null);
        
        try {
          const response = await fetch('/api/admin/report-categories', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log("Fetched categories response:", data);
          
          // Handle multiple possible response structures with fallback logic
          const categoriesArray = Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.categories)
              ? data.categories
              : Array.isArray(data)
                ? data
                : [];

          // Filter only active categories
          const activeCategories = categoriesArray.filter(
            (category: Category) => category.isActive === true
          );
          setCategories(activeCategories);
        } catch (error) {
          console.error('Failed to fetch categories:', error);
          setCategoriesError('Failed to load categories');
        } finally {
          setLoadingCategories(false);
        }
      };

      fetchCategories();
    }
  }, [open]);

  // Auto-close modal after 5 seconds when success state is active
  useEffect(() => {
    if (showSuccess) {
      const timeout = setTimeout(() => {
        onClose();
      }, 5000);
      setAutoCloseTimeout(timeout);
      
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    } else {
      // Clear timeout if success state is cleared
      if (autoCloseTimeout) {
        clearTimeout(autoCloseTimeout);
        setAutoCloseTimeout(null);
      }
    }
  }, [showSuccess, onClose]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimeout) {
        clearTimeout(autoCloseTimeout);
      }
    };
  }, [autoCloseTimeout]);

  // Validate form fields
  const validateForm = () => {
    const newErrors: { category?: string; message?: string } = {};
    
    if (!selectedCategory) {
      newErrors.category = 'Category is required';
    }
    
    if (!message.trim()) {
      newErrors.message = 'Message is required';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form has required fields filled
  const hasRequiredFields = () => {
    return selectedCategory && message.trim() && message.trim().length >= 10 && !loadingCategories && !categoriesError;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        categoryId: selectedCategory,
        message: message.trim()
      };

      console.log("Submitting report payload:", payload);

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const responseData = await response.json().catch(() => null);
      console.log("Report submit response:", responseData);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, response: ${JSON.stringify(responseData)}`);
      }

      console.log('Report submitted successfully:', responseData);
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to submit report:', error);
      setErrors({ message: 'Failed to submit report. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleReset = () => {
    setSelectedCategory('');
    setMessage('');
    setErrors({});
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="REPORT AN ISSUE"
      subtitle={showSuccess ? "Your report has been submitted successfully!" : "Spotted something wrong or inappropriate?"}
      variant="accent"
    >
      {showSuccess ? (
        <div className="space-y-spacing-lg">
          {/* Show submitted values */}
          <div className="space-y-spacing-sm">
            <p className="text-body text-primary">
              Category: {categories.find(cat => cat._id === selectedCategory)?.label || 'Unknown Category'}
            </p>
            <p className="text-body text-primary">
              Message: {message}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-spacing-xl">
          {/* Category Dropdown */}
          <div className="space-y-spacing-sm">
            <label className="text-caption font-bold text-primary">
              Category
            </label>
            <Dropdown
              options={categories.map(category => ({
                id: category._id,
                label: category.label,
                description: category.description
              }))}
              selectedId={selectedCategory || undefined}
              onSelect={setSelectedCategory}
              placeholder={loadingCategories ? "Loading categories..." : categoriesError ? "Failed to load categories" : "Select a category"}
              disabled={loadingCategories || !!categoriesError}
              variant="onAccentWithDescription"
              ariaLabel="Select Category"
            />
            {errors.category && (
              <p className="text-caption text-alert mt-spacing-xs">{errors.category}</p>
            )}
            {categoriesError && (
              <p className="text-caption text-alert mt-spacing-xs">{categoriesError}</p>
            )}
          </div>

          {/* Message Input */}
          <div className="space-y-spacing-sm">
            <label className="text-caption font-bold text-primary">
              Message
            </label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue..."
                rows={3}
                className="w-full pl-spacing-md pr-spacing-md py-spacing-md border border-ui-muted rounded-card bg-white text-body focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-vertical"
              />
            </div>
            {errors.message && (
              <p className="text-caption text-alert mt-spacing-xs">{errors.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-spacing-xl pt-spacing-lg border-t border-primary/20">
        {showSuccess ? (
          <C2AButton
            variant="secondary"
            context="onAccent"
            onClick={onClose}
            fullWidth
            aria-label="Close"
          >
            Close
          </C2AButton>
        ) : (
          <>
            <C2AButton
              variant="ghost"
              context="onAccent"
              onClick={handleReset}
              disabled={isSubmitting}
              aria-label="Reset Form"
            >
              Reset
            </C2AButton>
            
            <C2AButton
              variant={hasRequiredFields() ? "primary" : "secondary"}
              context="onAccent"
              onClick={handleSubmit}
              disabled={!hasRequiredFields() || isSubmitting}
              fullWidth
              className="ml-spacing-md"
              aria-label="Submit"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </C2AButton>
          </>
        )}
      </div>
    </BaseModal>
  );
};

export default ReportIssueModal;
