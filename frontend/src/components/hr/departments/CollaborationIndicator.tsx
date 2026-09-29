"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface CollaborationIndicatorProps {
  resourceId: string;
  resourceType: string;
}

export function CollaborationIndicator({ resourceId, resourceType }: CollaborationIndicatorProps) {
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000'}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        resourceId,
        resourceType
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'users') {
        setActiveUsers(data.users);
      }
    };

    return () => {
      ws.send(JSON.stringify({ type: 'leave', resourceId, resourceType }));
      ws.close();
    };
  }, [resourceId, resourceType]);

  if (activeUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        {activeUsers.length} viewing
      </Badge>
      <div className="flex -space-x-2">
        {activeUsers.slice(0, 3).map((user, i) => (
          <Avatar key={i} className="w-6 h-6 border-2 border-white">
            <AvatarFallback className="text-xs">
              {user.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        ))}
        {activeUsers.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs border-2 border-white">
            +{activeUsers.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}
