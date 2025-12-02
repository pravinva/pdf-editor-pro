'use client';

import { useState, useEffect } from 'react';

interface FormField {
  name: string;
  type: string;
  value: string;
  page: number;
  rect?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  options?: string[];
}

interface FormFillerProps {
  fields: FormField[];
  onFill: (fieldData: Record<string, string>) => void;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

export default function FormFiller({
  fields,
  onFill,
  onCancel,
  loading = false,
  className = ''
}: FormFillerProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState<number | 'all'>('all');

  // Initialize form data with existing field values
  useEffect(() => {
    const initialData: Record<string, string> = {};
    fields.forEach(field => {
      initialData[field.name] = field.value || '';
    });
    setFormData(initialData);
  }, [fields]);

  // Get unique pages
  const pages = Array.from(new Set(fields.map(f => f.page))).sort((a, b) => a - b);

  // Filter fields by current page
  const displayFields = currentPage === 'all'
    ? fields
    : fields.filter(f => f.page === currentPage);

  // Group fields by page
  const fieldsByPage = fields.reduce((acc, field) => {
    if (!acc[field.page]) {
      acc[field.page] = [];
    }
    acc[field.page].push(field);
    return acc;
  }, {} as Record<number, FormField[]>);

  // Handle field change
  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear validation error for this field
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.name];

      // Check required fields (you might want to add a 'required' property to fields)
      if (!value || value.trim() === '') {
        // Optional: mark certain fields as required
        // errors[field.name] = 'This field is required';
      }

      // Add more validation rules as needed
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors[field.name] = 'Invalid email address';
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle fill
  const handleFill = () => {
    if (!validateForm()) {
      return;
    }
    onFill(formData);
  };

  // Clear all fields
  const handleClearAll = () => {
    const clearedData: Record<string, string> = {};
    fields.forEach(field => {
      clearedData[field.name] = '';
    });
    setFormData(clearedData);
    setValidationErrors({});
  };

  // Auto-fill demo data (for testing)
  const handleAutoFill = () => {
    const demoData: Record<string, string> = {};
    fields.forEach(field => {
      switch (field.type.toLowerCase()) {
        case 'text':
          if (field.name.toLowerCase().includes('name')) {
            demoData[field.name] = 'John Doe';
          } else if (field.name.toLowerCase().includes('email')) {
            demoData[field.name] = 'john.doe@example.com';
          } else if (field.name.toLowerCase().includes('phone')) {
            demoData[field.name] = '+1-555-0123';
          } else if (field.name.toLowerCase().includes('address')) {
            demoData[field.name] = '123 Main Street';
          } else if (field.name.toLowerCase().includes('city')) {
            demoData[field.name] = 'New York';
          } else if (field.name.toLowerCase().includes('zip')) {
            demoData[field.name] = '10001';
          } else {
            demoData[field.name] = 'Sample Text';
          }
          break;
        case 'checkbox':
          demoData[field.name] = 'true';
          break;
        case 'select':
        case 'dropdown':
          if (field.options && field.options.length > 0) {
            demoData[field.name] = field.options[0];
          }
          break;
        default:
          demoData[field.name] = 'Sample Value';
      }
    });
    setFormData(demoData);
  };

  // Render field input based on type
  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const error = validationErrors[field.name];
    const fieldId = `field-${field.name}`;

    const commonInputClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      error ? 'border-red-500' : 'border-slate-300'
    }`;

    switch (field.type.toLowerCase()) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'date':
        return (
          <input
            id={fieldId}
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={commonInputClass}
            placeholder={`Enter ${field.name}`}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={`${commonInputClass} min-h-[80px]`}
            placeholder={`Enter ${field.name}`}
            rows={3}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              id={fieldId}
              type="checkbox"
              checked={value === 'true' || value === 'Yes' || value === 'On'}
              onChange={(e) => handleFieldChange(field.name, e.target.checked ? 'true' : 'false')}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={fieldId} className="ml-2 text-sm text-slate-700">
              Check this box
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="flex items-center gap-4">
            {(field.options || ['Yes', 'No']).map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'select':
      case 'dropdown':
        return (
          <select
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={commonInputClass}
          >
            <option value="">Select an option</option>
            {(field.options || []).map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={commonInputClass}
            placeholder={`Enter ${field.name}`}
          />
        );
    }
  };

  if (fields.length === 0) {
    return (
      <div className={`card max-w-md mx-auto text-center ${className}`}>
        <div className="text-slate-400 text-5xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Form Fields Found</h3>
        <p className="text-slate-600 mb-4">
          This PDF does not contain any fillable form fields.
        </p>
        <button onClick={onCancel} className="btn btn-outline">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-slate-900">Fill Form Fields</h2>
          <span className="text-sm text-slate-600">
            {fields.length} field{fields.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {/* Page Filter */}
        {pages.length > 1 && (
          <div className="flex items-center gap-2 mt-3">
            <label className="text-sm font-medium text-slate-700">Filter by page:</label>
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white"
            >
              <option value="all">All Pages ({fields.length} fields)</option>
              {pages.map(page => (
                <option key={page} value={page}>
                  Page {page + 1} ({fieldsByPage[page].length} fields)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleAutoFill}
            className="btn btn-outline text-sm"
            disabled={loading}
          >
            Auto-Fill Demo
          </button>
          <button
            onClick={handleClearAll}
            className="btn btn-outline text-sm"
            disabled={loading}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="px-6 py-4 max-h-[500px] overflow-y-auto">
        <div className="space-y-4">
          {displayFields.map((field, index) => (
            <div key={`${field.name}-${index}`} className="border-b border-slate-100 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <label
                    htmlFor={`field-${field.name}`}
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    {field.name}
                  </label>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="px-2 py-0.5 bg-slate-100 rounded">
                      {field.type}
                    </span>
                    <span>Page {field.page + 1}</span>
                  </div>
                </div>
              </div>

              {renderField(field)}

              {validationErrors[field.name] && (
                <p className="mt-1 text-xs text-red-600">
                  {validationErrors[field.name]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-3">
        <button
          onClick={onCancel}
          className="btn btn-outline"
          disabled={loading}
        >
          Cancel
        </button>

        <button
          onClick={handleFill}
          className="btn btn-primary"
          disabled={loading || Object.keys(validationErrors).length > 0}
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Filling...
            </>
          ) : (
            'Fill PDF Fields'
          )}
        </button>
      </div>

      {/* Info */}
      <div className="px-6 pb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Fill in the form fields above and click "Fill PDF Fields" to apply changes to your PDF.
            All fields will be embedded into the PDF document.
          </p>
        </div>
      </div>
    </div>
  );
}
