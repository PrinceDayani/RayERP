'use client';

import { MessageSquare, ThumbsUp, Edit, Trash2 } from 'lucide-react';

interface Activity {
  _id: string;
  type: 'comment' | 'reply' | 'reaction' | 'edit' | 'delete';
  user: { name: string };
  comment?: { content: string };
  createdAt: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment':
      case 'reply':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'reaction':
        return <ThumbsUp className="w-4 h-4 text-green-600" />;
      case 'edit':
        return <Edit className="w-4 h-4 text-orange-600" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'comment':
        return 'posted a comment';
      case 'reply':
        return 'replied to a comment';
      case 'reaction':
        return 'reacted to a comment';
      case 'edit':
        return 'edited a comment';
      case 'delete':
        return 'deleted a comment';
      default:
        return 'performed an action';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity._id} className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50">
          <div className="mt-1">{getActivityIcon(activity.type)}</div>
          <div className="flex-1">
            <div className="text-sm">
              <span className="font-semibold">{activity.user.name}</span>
              <span className="text-gray-600 ml-1">{getActivityText(activity)}</span>
            </div>
            {activity.comment && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {activity.comment.content}
              </p>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {new Date(activity.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
