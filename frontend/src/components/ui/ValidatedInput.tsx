// Real-time Validation Wrapper for Form Inputs

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { validateGSTNumber, validatePANNumber, validateIFSCCode } from '@/utils/validation';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    validationType?: 'gst' | 'pan' | 'ifsc' | 'email' | 'phone' | 'number' | 'required';
    label?: string;
    onValidChange?: (isValid: boolean) => void;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
    validationType,
    label,
    onValidChange,
    className = '',
    ...props
}) => {
    const [error, setError] = useState<string>('');
    const [touched, setTouched] = useState(false);

    const validate = (value: string) => {
        if (!touched || !value) return '';

        switch (validationType) {
            case 'gst':
                return validateGSTNumber(value) ? '' : 'Invalid GST number (15 characters: 22AAAAA0000A1Z5)';
            case 'pan':
                return validatePANNumber(value) ? '' : 'Invalid PAN number (10 characters: AAAAA0000A)';
            case 'ifsc':
                return validateIFSCCode(value) ? '' : 'Invalid IFSC code (11 characters: AAAA0AAAAAA)';
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Invalid email address';
            case 'phone':
                return /^[6-9]\d{9}$/.test(value) ? '' : 'Invalid phone number (10 digits starting with 6-9)';
            case 'number':
                return !isNaN(Number(value)) && Number(value) >= 0 ? '' : 'Must be a valid positive number';
            case 'required':
                return value.trim().length > 0 ? '' : 'This field is required';
            default:
                return '';
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setTouched(true);
        const validationError = validate(e.target.value);
        setError(validationError);
        onValidChange?.(validationError === '');
        props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (touched) {
            const validationError = validate(e.target.value);
            setError(validationError);
            onValidChange?.(validationError === '');
        }
        props.onChange?.(e);
    };

    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {validationType === 'required' && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <Input
                {...props}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${className} ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {error && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};

export default ValidatedInput;
