//path: frontend/src/components/FileShareDialog.tsx

'use client';

import { useState } from 'react';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface FileShareDialogProps {
  fileId: string;
  fileName: string;
  employees: Employee[];
  onShare: (fileId: string, employeeIds: string[], message: string) => Promise<void>;
  onClose: () => void;
}

export default function FileShareDialog({
  fileId,
  fileName,
  employees,
  onShare,
  onClose
}: FileShareDialogProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleShare = async () => {
    if (selectedEmployees.length === 0) {
      alert('Please select at least one employee');
      return;
    }

    setLoading(true);
    try {
      await onShare(fileId, selectedEmployees, message);
      onClose();
    } catch (error) {
      console.error('Failed to share file:', error);
      alert('Failed to share file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Share File: {fileName}</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select Employees
          </label>
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {employees.map(employee => (
              <label
                key={employee._id}
                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedEmployees.includes(employee._id)}
                  onChange={() => handleToggleEmployee(employee._id)}
                  className="mr-2"
                />
                <span>
                  {employee.firstName} {employee.lastName}
                  <span className="text-sm text-gray-500 ml-2">
                    ({employee.email})
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {selectedEmployees.length} employee(s) selected
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message for the recipients..."
            className="w-full border rounded-lg p-2 h-24 resize-none"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={loading || selectedEmployees.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sharing...' : 'Share File'}
          </button>
        </div>
      </div>
    </div>
  );
}
