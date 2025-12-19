import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
    title?: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
}

export default function EmptyState({
    title = 'No data available',
    message,
    actionLabel,
    onAction,
    icon
}: EmptyStateProps) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 px-6">
                <div className="rounded-full bg-muted p-3 mb-4">
                    {icon || <FileQuestion className="w-10 h-10 text-muted-foreground" />}
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                    {message}
                </p>
                {actionLabel && onAction && (
                    <Button onClick={onAction}>
                        {actionLabel}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
