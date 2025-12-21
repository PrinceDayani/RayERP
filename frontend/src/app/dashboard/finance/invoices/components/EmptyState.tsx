'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, TrendingUp } from 'lucide-react';

interface EmptyStateProps {
    type?: 'all' | 'invoices' | 'payments' | 'receipts';
    onCreateNew?: () => void;
}

export default function EmptyState({ type = 'all', onCreateNew }: EmptyStateProps) {
    const content = {
        all: {
            icon: FileText,
            title: 'No finance records yet',
            description: 'Get started by creating your first invoice or recording a payment',
            action: 'Create Invoice',
        },
        invoices: {
            icon: FileText,
            title: 'No invoices created',
            description: 'Create your first invoice to start tracking revenue and receivables',
            action: 'Create Invoice',
        },
        payments: {
            icon: TrendingUp,
            title: 'No payments recorded',
            description: 'Record your first payment to track cash inflows and customer payments',
            action: 'Record Payment',
        },
        receipts: {
            icon: FileText,
            title: 'No receipts found',
            description: 'Receipts will appear here once payments are processed',
            action: 'View Payments',
        },
    };

    const config = content[type];
    const Icon = config.icon;

    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                    <Icon className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
                <p className="text-muted-foreground mb-6 max-w-md">{config.description}</p>
                {onCreateNew && (
                    <Button size="lg" onClick={onCreateNew}>
                        <Plus className="mr-2 h-5 w-5" />
                        {config.action}
                    </Button>
                )}
                <div className="mt-8 p-4 bg-muted rounded-lg max-w-2xl">
                    <p className="text-sm font-medium mb-2">💡 Quick Tips:</p>
                    <ul className="text-sm text-muted-foreground text-left space-y-1">
                        <li>• Use the filters above to narrow down your search</li>
                        <li>• Invoices and payments are unified in one view</li>
                        <li>• Click on any record to view details and take actions</li>
                        <li>• Use bulk actions to process multiple records at once</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
