'use client';

import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
    MoreVertical,
    Eye,
    Download,
    Mail,
    Copy,
    FileText,
    CheckCircle,
    Trash2,
    Edit,
    CreditCard,
    BookOpen,
    ThumbsUp,
    Send,
} from 'lucide-react';

interface FinanceRecordActionsProps {
    recordId: string;
    recordType: 'payment' | 'invoice';
    status?: string;
    onView: () => void;
    onDownloadPDF: () => void;
    onSendEmail: () => void;
    onDuplicate: () => void;
    onMarkPaid?: () => void;
    onRecordPayment?: () => void;
    onViewLedger?: () => void;
    onApprove?: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export default function FinanceRecordActions({
    recordId,
    recordType,
    status,
    onView,
    onDownloadPDF,
    onSendEmail,
    onDuplicate,
    onMarkPaid,
    onRecordPayment,
    onViewLedger,
    onApprove,
    onEdit,
    onDelete,
}: FinanceRecordActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onView}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                {onViewLedger && (
                    <DropdownMenuItem onClick={onViewLedger}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        View Ledger
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDownloadPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSendEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send via Email
                </DropdownMenuItem>
                {status === 'DRAFT' && onApprove && (
                    <DropdownMenuItem onClick={onApprove}>
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Approve
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                </DropdownMenuItem>
                {recordType === 'invoice' && onMarkPaid && (
                    <DropdownMenuItem onClick={onMarkPaid}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Paid
                    </DropdownMenuItem>
                )}
                {recordType === 'invoice' && onRecordPayment && (
                    <DropdownMenuItem onClick={onRecordPayment}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Record Payment
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
