import api from './axios';

export interface BudgetComment {
  _id: string;
  budget: string;
  author: { _id: string; name: string; email: string };
  content: string;
  mentions: Array<{ _id: string; name: string }>;
  parentComment?: string;
  replies: BudgetComment[];
  reactions: Array<{
    type: 'like' | 'approve' | 'concern' | 'question';
    user: { _id: string; name: string };
    createdAt: string;
  }>;
  attachments?: Array<{ filename: string; url: string; size: number }>;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  mentions?: string[];
  parentCommentId?: string;
}

export const budgetCommentAPI = {
  createComment: async (budgetId: string, data: CreateCommentRequest) => {
    const response = await api.post(`/budget-comments/budget/${budgetId}`, data);
    return response.data;
  },

  getComments: async (budgetId: string) => {
    const response = await api.get(`/budget-comments/budget/${budgetId}`);
    return response.data;
  },

  updateComment: async (commentId: string, content: string) => {
    const response = await api.put(`/budget-comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (commentId: string) => {
    const response = await api.delete(`/budget-comments/${commentId}`);
    return response.data;
  },

  addReaction: async (commentId: string, type: 'like' | 'approve' | 'concern' | 'question') => {
    const response = await api.post(`/budget-comments/${commentId}/reaction`, { type });
    return response.data;
  },

  removeReaction: async (commentId: string) => {
    const response = await api.delete(`/budget-comments/${commentId}/reaction`);
    return response.data;
  },

  getActivityFeed: async (budgetId: string) => {
    const response = await api.get(`/budget-comments/budget/${budgetId}/activity`);
    return response.data;
  },

  getUserMentions: async () => {
    const response = await api.get('/budget-comments/mentions/me');
    return response.data;
  },
};
