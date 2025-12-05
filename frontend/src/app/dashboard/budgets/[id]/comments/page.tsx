'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { budgetCommentAPI, BudgetComment } from '@/lib/api/budgetCommentAPI';
import CommentThread from '@/components/budget/CommentThread';
import CommentInput from '@/components/budget/CommentInput';
import ActivityFeed from '@/components/budget/ActivityFeed';
import { MessageSquare, Activity, ThumbsUp, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import api from '@/lib/api/axios';

export default function BudgetCommentsPage() {
  const [budgetId, setBudgetId] = useState('');
  const [budgetName, setBudgetName] = useState('');
  const [comments, setComments] = useState<BudgetComment[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setCurrentUserId(response.data.data._id);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const fetchComments = async () => {
    if (!budgetId) return;
    
    setLoading(true);
    try {
      const [commentsRes, activityRes] = await Promise.all([
        budgetCommentAPI.getComments(budgetId),
        budgetCommentAPI.getActivityFeed(budgetId),
      ]);
      setComments(commentsRes.data || []);
      setActivities(activityRes.data || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!budgetId.trim()) return;
    
    try {
      const response = await api.get(`/budgets/${budgetId}`);
      setBudgetName(response.data.data.budgetName);
      fetchComments();
    } catch (err) {
      console.error('Budget not found:', err);
      setBudgetName('');
      setComments([]);
    }
  };

  const topLevelComments = comments.filter(c => !c.parentComment);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Budget Collaboration & Comments</h1>
        <p className="text-gray-600 mt-1">Team collaboration with comments, mentions, and reactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-blue-600" />
              Like
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">👍 Show support</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Approve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">✅ Approve idea</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              Concern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">⚠️ Raise concern</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              Question
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">❓ Ask question</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Budget</CardTitle>
          <CardDescription>Enter budget ID to view and post comments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Budget ID"
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
          {budgetName && (
            <div className="mt-3 text-sm">
              <span className="text-gray-600">Budget:</span>
              <span className="font-semibold ml-2">{budgetName}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {budgetName && (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Post a Comment</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CommentInput budgetId={budgetId} onSuccess={fetchComments} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {activeTab === 'comments' ? 'Comments' : 'Activity Feed'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === 'comments' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('comments')}
                    size="sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Comments ({topLevelComments.length})
                  </Button>
                  <Button
                    variant={activeTab === 'activity' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('activity')}
                    size="sm"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Activity
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : activeTab === 'comments' ? (
                <div className="space-y-4">
                  {topLevelComments.length > 0 ? (
                    topLevelComments.map((comment) => (
                      <CommentThread
                        key={comment._id}
                        comment={comment}
                        onRefresh={fetchComments}
                        currentUserId={currentUserId}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No comments yet. Be the first to comment!
                    </div>
                  )}
                </div>
              ) : (
                <ActivityFeed activities={activities} />
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How Collaboration Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2">1. Post Comments</div>
              <p className="text-sm text-gray-600">
                Share thoughts and feedback on budgets
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2">2. Mention Team</div>
              <p className="text-sm text-gray-600">
                Use @username to notify team members
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2">3. React & Reply</div>
              <p className="text-sm text-gray-600">
                Use reactions and threaded replies
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Key Features</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Threaded comments with unlimited replies</li>
              <li>✓ @mentions with notifications</li>
              <li>✓ 4 reaction types (👍 ✅ ⚠️ ❓)</li>
              <li>✓ Edit and delete comments</li>
              <li>✓ Complete activity feed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
