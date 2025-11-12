//path: frontend/src/components/FileUploadDropzone.tsx

'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface FileUploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

export default function FileUploadDropzone({
  onFilesSelected,
  accept = '*',
  maxSize = 50 * 1024 * 1024,
  multiple = true
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    validateAndProcess(files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      validateAndProcess(files);
    }
  };

  const validateAndProcess = (files: File[]) => {
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`${file.name} exceeds ${maxSize / (1024 * 1024)}MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept={accept}
        multiple={multiple}
        className="hidden"
      />
      
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 48 48"
      >
        <path
          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      <p className="mt-2 text-sm text-gray-600">
        <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Max file size: {maxSize / (1024 * 1024)}MB
      </p>
    </div>
  );
}
