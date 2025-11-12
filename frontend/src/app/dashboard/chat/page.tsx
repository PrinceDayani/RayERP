'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import { Card } from '@/components/ui/card';

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-4rem)] p-4">
      <Card className="h-full overflow-hidden">
        <ChatInterface />
      </Card>
    </div>
  );
}
