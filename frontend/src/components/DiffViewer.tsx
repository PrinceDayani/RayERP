import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DiffViewerProps {
  before: any;
  after: any;
}

export const DiffViewer = ({ before, after }: DiffViewerProps) => {
  const changes = useMemo(() => {
    const diffs: Array<{ key: string; before: any; after: any; type: 'added' | 'removed' | 'modified' }> = [];
    
    const allKeys = new Set([
      ...Object.keys(before || {}),
      ...Object.keys(after || {})
    ]);

    allKeys.forEach(key => {
      const beforeVal = before?.[key];
      const afterVal = after?.[key];

      if (beforeVal === undefined && afterVal !== undefined) {
        diffs.push({ key, before: undefined, after: afterVal, type: 'added' });
      } else if (beforeVal !== undefined && afterVal === undefined) {
        diffs.push({ key, before: beforeVal, after: undefined, type: 'removed' });
      } else if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        diffs.push({ key, before: beforeVal, after: afterVal, type: 'modified' });
      }
    });

    return diffs;
  }, [before, after]);

  const formatValue = (value: any): string => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'added': return 'bg-green-100 text-green-800 border-green-300';
      case 'removed': return 'bg-red-100 text-red-800 border-red-300';
      case 'modified': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (changes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No changes detected
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {changes.map((change, idx) => (
        <Card key={idx} className="overflow-hidden">
          <CardHeader className="py-3 px-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono">{change.key}</CardTitle>
              <Badge className={`text-xs ${getTypeColor(change.type)}`}>
                {change.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {change.type !== 'added' && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Before:</p>
                  <pre className="text-xs bg-red-50 p-3 rounded border border-red-200 overflow-x-auto">
                    {formatValue(change.before)}
                  </pre>
                </div>
              )}
              {change.type !== 'removed' && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">After:</p>
                  <pre className="text-xs bg-green-50 p-3 rounded border border-green-200 overflow-x-auto">
                    {formatValue(change.after)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
