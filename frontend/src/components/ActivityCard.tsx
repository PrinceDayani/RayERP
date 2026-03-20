"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Eye, Info, X } from 'lucide-react';
import { Activity } from '@/types/activity';
import { formatTimeAgo, getActionIcon, getActionColor, getCategoryIcon, getSeverityColor } from '@/lib/utils/activityUtils';

interface ActivityCardProps {
  activity: Activity;
  onViewDetails: (activityId: string) => void;
}

export function ActivityCard({ activity, onViewDetails }: ActivityCardProps) {
  const ActionIcon = getActionIcon(activity.action, activity.resourceType);

  return (
    <Card 
      className="bg-card border border-border hover:border-primary/50 transition-colors group overflow-hidden"
      tabIndex={0}
      role="article"
      aria-label={`Activity: ${activity.userName} ${activity.action}d ${activity.resource}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetails(activity._id);
        }
      }}
    >
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="relative flex-shrink-0">
            <div className={`w-12 h-12 rounded-xl ${getActionColor(activity.action)} flex items-center justify-center text-white`}>
              <ActionIcon className="h-4 w-4" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center">
              <div className={`w-2.5 h-2.5 rounded-full ${
                activity.status === 'success' ? 'bg-primary' : 
                activity.status === 'error' ? 'bg-destructive' : 'bg-muted-foreground'
              }`}></div>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-base leading-relaxed">
                  <span className="font-bold text-primary">{activity.userName}</span>
                  {' '}
                  <span className="text-muted-foreground capitalize">{activity.action}d</span>
                  {' '}
                  <span className="font-semibold text-foreground">{activity.resource}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{activity.details}</p>
                
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Badge variant="outline" className="text-xs capitalize font-medium">
                    {activity.resourceType}
                  </Badge>
                  {(activity.projectId || activity.projectName) && (
                    <Badge variant="secondary" className="text-xs">
                      📁 {activity.projectId?.name || activity.projectName}
                    </Badge>
                  )}
                  {activity.metadata?.category && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      {activity.metadata.category}
                    </Badge>
                  )}
                  {activity.metadata?.severity && activity.metadata.severity !== 'low' && (
                    <Badge className={`text-xs ${getSeverityColor(activity.metadata.severity)}`}>
                      {activity.metadata.severity}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-right flex flex-col items-end gap-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap block">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                  <span className="text-xs text-muted-foreground/70 whitespace-nowrap block mt-1">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {activity.status === 'success' && <CheckCircle className="h-4 w-4 text-primary" aria-label="Success" />}
                  {activity.status === 'error' && <X className="h-4 w-4 text-destructive" aria-label="Error" />}
                  {activity.status === 'warning' && <Info className="h-4 w-4 text-yellow-600" aria-label="Warning" />}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(activity._id)}
                    className="text-xs h-8 px-3"
                    aria-label="View activity details"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
