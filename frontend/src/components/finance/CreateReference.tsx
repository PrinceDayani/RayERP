'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Search, X } from 'lucide-react';

interface Account {
  _id: string;
  code: string;
  name: string;
  type: string;
}

interface JournalEntry {
  _id: string;
  entryNumber: string;
  reference: string;
  description: string;
  status: string;
}

interface CreateReferenceProps {
  open: boolean;
  onClose: () => void;
  journalEntryId?: string;
  entryNumber?: string;
  reference?: string;
  description?: string;
  onSuccess?: () => void;
}

export default function CreateReference({
  open,
  onClose,
  journalEntryId = '',
  entryNumber = '',
  reference = '',
  description = '',
  onSuccess
}: CreateReferenceProps) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedJE, setSelectedJE] = useState<JournalEntry | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [jeSearch, setJeSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [manualReference, setManualReference] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingJEs, setLoadingJEs] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAccounts();
      if (!journalEntryId) {
        fetchJournalEntries();
      } else {
        // Pre-select JE if provided
        setSelectedJE({
          _id: journalEntryId,
          entryNumber: entryNumber || '',
          reference: reference || '',
          description: description || '',
          status: 'POSTED'
        });
      }
    }
  }, [open, journalEntryId]);

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const token = localStorage.getItem('auth-token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load accounts',
        variant: 'destructive'
      });
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchJournalEntries = async () => {
    try {
      setLoadingJEs(true);
      const token = localStorage.getItem('auth-token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/journal-entries?status=POSTED`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch journal entries');
      const data = await response.json();
      // Filter only JEs with reference field
      const jesWithRef = (data.data || []).filter((je: any) => je.reference);
      setJournalEntries(jesWithRef);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load journal entries',
        variant: 'destructive'
      });
    } finally {
      setLoadingJEs(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedAccount) {
      toast({
        title: 'Missing Account',
        description: 'Please select an account',
        variant: 'destructive'
      });
      return;
    }

    if (!amount) {
      toast({
        title: 'Missing Amount',
        description: 'Please enter an amount',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedJE && !manualReference) {
      toast({
        title: 'Missing Reference',
        description: 'Please enter a reference number or select a journal entry',
        variant: 'destructive'
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive'
      });
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('auth-token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reference-payments/create-reference`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            journalEntryId: selectedJE?._id,
            accountId: selectedAccount._id,
            amount: amountNum,
            reference: manualReference || undefined,
            description: manualDescription || undefined
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create reference');
      }

      toast({
        title: 'Success',
        description: data.message || 'Reference created successfully'
      });

      // Reset form
      setSelectedAccount(null);
      setSelectedJE(null);
      setAmount('');
      setManualReference('');
      setManualDescription('');
      setAccountSearch('');
      setJeSearch('');
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create reference',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.code.toLowerCase().includes(accountSearch.toLowerCase()) ||
      acc.name.toLowerCase().includes(accountSearch.toLowerCase())
  );

  const filteredJEs = journalEntries.filter(
    (je) =>
      je.entryNumber.toLowerCase().includes(jeSearch.toLowerCase()) ||
      je.reference.toLowerCase().includes(jeSearch.toLowerCase()) ||
      je.description.toLowerCase().includes(jeSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Reference Balance</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Journal Entry Selection */}
          {!journalEntryId && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Select Journal Entry (Optional)</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by entry number, reference, or description..."
                  value={jeSearch}
                  onChange={(e) => setJeSearch(e.target.value)}
                  className="pl-10"
                />
                {jeSearch && (
                  <button
                    onClick={() => setJeSearch('')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {loadingJEs ? (
                <div className="flex justify-center py-8">
                  <Spinner className="w-6 h-6" />
                </div>
              ) : (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredJEs.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 text-sm">
                      No posted journal entries with references found
                    </p>
                  ) : (
                    filteredJEs.map((je) => (
                      <div
                        key={je._id}
                        onClick={() => setSelectedJE(je)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                          selectedJE?._id === je._id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold">{je.entryNumber}</span>
                              <span className="text-sm font-semibold text-blue-600">{je.reference}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{je.description}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {selectedJE && (
                <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
                  <p className="text-sm text-green-800">
                    Selected: <span className="font-mono font-semibold">{selectedJE.entryNumber}</span> - {selectedJE.reference}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Show JE info if pre-selected */}
          {journalEntryId && selectedJE && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Entry Number:</span>
                  <p className="font-mono font-semibold">{selectedJE.entryNumber}</p>
                </div>
                <div>
                  <span className="text-gray-600">Reference:</span>
                  <p className="font-semibold text-blue-600">{selectedJE.reference}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Description:</span>
                  <p className="mt-1">{selectedJE.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Account Selection */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Select Account *</Label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search accounts by code or name..."
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                className="pl-10"
              />
              {accountSearch && (
                <button
                  onClick={() => setAccountSearch('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {loadingAccounts ? (
              <div className="flex justify-center py-8">
                <Spinner className="w-6 h-6" />
              </div>
            ) : (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {filteredAccounts.length === 0 ? (
                  <p className="text-center py-8 text-gray-500 text-sm">No accounts found</p>
                ) : (
                  filteredAccounts.map((acc) => (
                    <div
                      key={acc._id}
                      onClick={() => setSelectedAccount(acc)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                        selectedAccount?._id === acc._id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-mono text-sm font-semibold">{acc.code}</span>
                          <span className="text-sm text-gray-600 ml-2">{acc.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 uppercase">{acc.type}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedAccount && (
              <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
                <p className="text-sm text-green-800">
                  Selected: <span className="font-mono font-semibold">{selectedAccount.code}</span> - {selectedAccount.name}
                </p>
              </div>
            )}
          </div>

          {/* Manual Reference Fields (when no JE selected) */}
          {!journalEntryId && !selectedJE && (
            <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-800">Manual Reference (No Journal Entry)</p>
              <div>
                <Label htmlFor="manualReference" className="text-sm font-semibold">Reference Number *</Label>
                <Input
                  id="manualReference"
                  value={manualReference}
                  onChange={(e) => setManualReference(e.target.value)}
                  placeholder="e.g., INV-001, PO-123"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="manualDescription" className="text-sm font-semibold">Description (Optional)</Label>
                <Input
                  id="manualDescription"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="Reference description"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <Label htmlFor="amount" className="text-sm font-semibold">Amount *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              The outstanding amount to track for this reference
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={processing || !selectedAccount || !amount}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {processing ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Creating...
              </>
            ) : (
              'Create Reference'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
