'use client';

import { Check, CheckCheck, Clock, AlertCircle, Send } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp?: string;
  readBy?: Array<{ _id: string; name: string; readAt: string }>;
  deliveredTo?: Array<{ _id: string; name: string; deliveredAt: string }>;
  className?: string;
}

export default function MessageStatus({ 
  status, 
  timestamp, 
  readBy = [], 
  deliveredTo = [],
  className = "" 
}: MessageStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400 animate-pulse" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return deliveredTo.length > 0 
          ? `Delivered to ${deliveredTo.map(u => u.name).join(', ')}`
          : 'Delivered';
      case 'read':
        return readBy.length > 0 
          ? `Read by ${readBy.map(u => u.name).join(', ')}`
          : 'Read';
      case 'failed':
        return 'Failed to send. Click to retry.';
      default:
        return '';
    }
  };

  const getDetailedInfo = () => {
    const info = [];
    
    if (timestamp) {
      info.push(`Sent: ${new Date(timestamp).toLocaleString()}`);
    }
    
    if (deliveredTo.length > 0) {
      info.push('Delivered to:');
      deliveredTo.forEach(user => {
        info.push(`• ${user.name} at ${new Date(user.deliveredAt).toLocaleString()}`);
      });
    }
    
    if (readBy.length > 0) {
      info.push('Read by:');
      readBy.forEach(user => {
        info.push(`• ${user.name} at ${new Date(user.readAt).toLocaleString()}`);
      });
    }
    
    return info.join('\n');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 cursor-help ${className}`}>
            {getStatusIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-xs">
            <p className="font-medium">{getStatusText()}</p>
            {getDetailedInfo() && (
              <pre className="mt-1 text-xs whitespace-pre-wrap">
                {getDetailedInfo()}
              </pre>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
