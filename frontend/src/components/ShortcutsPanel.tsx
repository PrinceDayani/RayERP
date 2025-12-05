'use client';

import { useState } from 'react';
import { X, Keyboard, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShortcutsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShortcutsPanel({ open, onOpenChange }: ShortcutsPanelProps) {
  const isOpen = open;

  const shortcuts = [
    {
      category: 'Finance Modules',
      items: [
        { keys: 'Alt + J', description: 'Journal Entry' },
        { keys: 'Alt + A', description: 'Accounts' },
        { keys: 'Alt + L', description: 'Account Ledger' },
        { keys: 'Alt + C', description: 'Chart of Accounts' },
        { keys: 'Alt + I', description: 'Invoices' },
        { keys: 'Alt + P', description: 'Payments' },
        { keys: 'Alt + B', description: 'Bills' },
        { keys: 'Alt + V', description: 'Vouchers' },
      ]
    },
    {
      category: 'Reports',
      items: [
        { keys: 'Alt + T', description: 'Trial Balance' },
        { keys: 'Alt + S', description: 'Balance Sheet' },
        { keys: 'Alt + F', description: 'Cash Flow' },
        { keys: 'Alt + R', description: 'Reports' },
        { keys: 'Alt + M', description: 'Master Ledger' },
      ]
    },
    {
      category: 'Advanced',
      items: [
        { keys: 'Alt + X', description: 'Tax Management' },
        { keys: 'Alt + K', description: 'Bank Reconciliation' },
        { keys: 'Alt + G', description: 'Aging Analysis' },
        { keys: 'Alt + N', description: 'Multi-Currency' },
        { keys: 'Alt + E', description: 'Recurring Entries' },
      ]
    },
    {
      category: 'Entry Actions',
      items: [
        { keys: 'Ctrl + S', description: 'Save current form' },
        { keys: 'Ctrl + Enter', description: 'Add new line (in entry)' },
      ]
    },
    {
      category: 'Date Shortcuts (in date fields)',
      items: [
        { keys: 'T', description: 'Today' },
        { keys: 'Y', description: 'Yesterday' },
        { keys: 'M', description: 'Start of Month' },
        { keys: '+', description: 'Next day' },
        { keys: '-', description: 'Previous day' },
      ]
    },
    {
      category: 'Navigation',
      items: [
        { keys: '↑↓', description: 'Navigate list items' },
        { keys: 'Enter', description: 'Select/View item' },
        { keys: 'Enter (in view)', description: 'Edit item' },
        { keys: 'Escape', description: 'Close dialog/dropdown' },
        { keys: 'Ctrl + ↑↓', description: 'Move between lines' },
        { keys: 'Ctrl + ←→', description: 'Move between fields' },
      ]
    },
  ];

  return (
    <>
      {/* Side Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-background border-l shadow-2xl z-[100] transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            <h2 className="font-semibold">Keyboard Shortcuts</h2>
          </div>
          <span className="text-xs opacity-80">Ctrl + K</span>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-73px)] p-4 space-y-6">
          {shortcuts.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 text-sm">
                    <span className="text-muted-foreground flex-1">{item.description}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono whitespace-nowrap">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t text-xs text-muted-foreground">
            <p>💡 Tip: Shortcuts don't work while typing in input fields</p>
            <p className="mt-2">Press <kbd className="px-1 bg-muted rounded">Ctrl + K</kbd> to toggle this panel</p>
          </div>
        </div>
      </div>


    </>
  );
}
