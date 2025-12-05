import { Request, Response } from 'express';
import BudgetComment from '../models/BudgetComment';
import BudgetActivity from '../models/BudgetActivity';
import Budget from '../models/Budget';
import mongoose from 'mongoose';

// Create comment
export const createComment = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;
    const { content, mentions, parentCommentId, attachments } = req.body;
    const userId = req.user?.userId;

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const comment = await BudgetComment.create({
      budget: budgetId,
      author: userId,
      content,
      mentions: mentions || [],
      parentComment: parentCommentId,
      attachments: attachments || []
    });

    // Log activity
    await BudgetActivity.create({
      budget: budgetId,
      user: userId,
      action: 'commented',
      description: `Added a comment on ${budget.budgetName}`,
      metadata: { commentId: comment._id }
    });

    // Log mentions
    if (mentions && mentions.length > 0) {
      await Promise.all(mentions.map((mentionedUserId: string) =>
        BudgetActivity.create({
          budget: budgetId,
          user: mentionedUserId,
          action: 'mentioned',
          description: `Mentioned in a comment by ${req.user?.name}`,
          metadata: { commentId: comment._id, mentionedBy: userId }
        })
      ));
    }

    const populatedComment = await BudgetComment.findById(comment._id)
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email')
      .populate('parentComment');

    res.status(201).json({
      message: 'Comment created successfully',
      comment: populatedComment
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating comment', error: error.message });
  }
};

// Get comments for budget
export const getBudgetComments = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;
    const { includeDeleted = false } = req.query;

    const filter: any = { budget: budgetId };
    if (!includeDeleted) filter.isDeleted = false;

    const comments = await BudgetComment.find(filter)
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email')
      .populate('parentComment')
      .populate('reactions.userId', 'name')
      .sort({ createdAt: -1 });

    // Organize into threads
    const topLevelComments = comments.filter(c => !c.parentComment);
    const replies = comments.filter(c => c.parentComment);

    const threaded = topLevelComments.map(comment => ({
      ...comment.toObject(),
      replies: replies.filter(r => r.parentComment?.toString() === comment._id.toString())
    }));

    res.json({ comments: threaded, count: topLevelComments.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

// Update comment
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    const comment = await BudgetComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== userId?.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    const populatedComment = await BudgetComment.findById(commentId)
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email');

    res.json({
      message: 'Comment updated successfully',
      comment: populatedComment
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating comment', error: error.message });
  }
};

// Delete comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.userId;

    const comment = await BudgetComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== userId?.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

// Add reaction
export const addReaction = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { type } = req.body;
    const userId = req.user?.userId;

    const comment = await BudgetComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Remove existing reaction from this user
    comment.reactions = comment.reactions.filter(r => r.userId.toString() !== userId?.toString());

    // Add new reaction
    comment.reactions.push({
      userId: new mongoose.Types.ObjectId(userId),
      type
    });

    await comment.save();

    const populatedComment = await BudgetComment.findById(commentId)
      .populate('reactions.userId', 'name');

    res.json({
      message: 'Reaction added successfully',
      comment: populatedComment
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding reaction', error: error.message });
  }
};

// Remove reaction
export const removeReaction = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.userId;

    const comment = await BudgetComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.reactions = comment.reactions.filter(r => r.userId.toString() !== userId?.toString());
    await comment.save();

    res.json({ message: 'Reaction removed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error removing reaction', error: error.message });
  }
};

// Get budget activity feed
export const getBudgetActivity = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;
    const { limit = 50, action } = req.query;

    const filter: any = { budget: budgetId };
    if (action) filter.action = action;

    const activities = await BudgetActivity.find(filter)
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ activities, count: activities.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching activity', error: error.message });
  }
};

// Get user mentions
export const getUserMentions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { unreadOnly = false } = req.query;

    const comments = await BudgetComment.find({
      mentions: userId,
      isDeleted: false
    })
      .populate('author', 'name email avatar')
      .populate('budget', 'budgetName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ mentions: comments, count: comments.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching mentions', error: error.message });
  }
};
