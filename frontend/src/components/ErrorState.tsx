import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    onBack?: () => void;
    showRetry?: boolean;
}

export default function ErrorState({
    title = 'Something went wrong',
    message,
    onRetry,
    onBack,
    showRetry = true
}: ErrorStateProps) {
    return (
        <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6">
                <div className="rounded-full bg-destructive/10 p-3 mb-4">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                    {message}
                </p>
                <div className="flex gap-3">
                    {showRetry && onRetry && (
                        <Button onClick={onRetry}>
                            Try Again
                        </Button>
                    )}
                    {onBack && (
                        <Button variant="outline" onClick={onBack}>
                            Go Back
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
