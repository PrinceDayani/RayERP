'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TypingIndicatorProps {
  users: Array<{ _id: string; name: string; email: string }>;
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].name} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].name} and ${users[1].name} are typing...`;
    } else {
      return `${users[0].name} and ${users.length - 1} others are typing...`;
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 animate-fade-in">
      <Avatar className="h-6 w-6">
        <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white text-xs">
          {getInitials(users[0].name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {getTypingText()}
        </span>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}