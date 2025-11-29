'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { validatePAN } from '@/utils/panValidator';

interface PANInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export const PANInput: React.FC<PANInputProps> = ({
  value,
  onChange,
  label = "PAN Number",
  placeholder = "AAAAA9999A",
  required = false,
  className = "",
  disabled = false
}) => {
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);

  useEffect(() => {
    if (value) {
      const validation = validatePAN(value);
      setError(validation.isValid ? '' : validation.error || 'Invalid PAN format');
      setIsValid(validation.isValid);
    } else {
      setError('');
      setIsValid(false);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Limit to 10 characters
    if (inputValue.length <= 10) {
      onChange(inputValue);
    }
  };

  const getInputClassName = () => {
    let baseClass = className;
    
    if (value && !isValid) {
      baseClass += ' border-red-500 focus:border-red-500 focus:ring-red-500';
    } else if (value && isValid) {
      baseClass += ' border-green-500 focus:border-green-500 focus:ring-green-500';
    }
    
    return baseClass;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="pan-input" className="flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id="pan-input"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={getInputClassName()}
          maxLength={10}
          disabled={disabled}
        />
        
        {value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </div>
      )}
      
      {!error && !value && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
        </div>
      )}
      
      {value && isValid && (
        <div className="flex items-center gap-1 text-sm text-green-600">
          <CheckCircle className="h-3 w-3" />
          Valid PAN format
        </div>
      )}
    </div>
  );
};