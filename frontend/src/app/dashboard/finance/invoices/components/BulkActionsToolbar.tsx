'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2, Send, CheckCircle, X } from 'lucide-react';

interface BulkActionsToolbarProps {
    selectedCount: number;
    onBulkDelete: () => void;
    onBulkApprove: () => void;
    onBulkSend: () => void;
    onClearSelection: () => void;
}

export default function BulkActionsToolbar({
    selectedCount,
    onBulkDelete,
    onBulkApprove,
    onBulkSend,
    onClearSelection,
}: BulkActionsToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-card border shadow-lg rounded-lg px-6 py-4 flex items-center gap-4">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                    {selectedCount} selected
                </Badge>
                <div className="h-6 w-px bg-border" />
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onBulkApprove}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                    </Button>
                    <Button variant="outline" size="sm" onClick={onBulkSend}>
                        <Send className="mr-2 h-4 w-4" />
                        Send
                    </Button>
                    <Button variant="outline" size="sm" onClick={onBulkDelete} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
                <div className="h-6 w-px bg-border" />
                <Button variant="ghost" size="sm" onClick={onClearSelection}>
                    <X className="mr-2 h-4 w-4" />
                    Clear
                </Button>
            </div>
        </div>
    );
}
