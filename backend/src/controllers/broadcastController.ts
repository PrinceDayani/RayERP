import { Request, Response } from 'express';
import Broadcast from '../models/Broadcast';
import User from '../models/User';
import Employee from '../models/Employee';
import { io } from '../server';

export const broadcastController = {
  // Send broadcast message
  sendBroadcast: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { content, type, departmentId } = req.body;

      const user = await User.findById(userId).populate('role');
      const isRoot = user?.role && (user.role as any).name?.toLowerCase() === 'root';
      const isAdmin = user?.role && ['root', 'super_admin', 'admin'].includes((user.role as any).name?.toLowerCase());

      if (type === 'webapp' && !isRoot) {
        return res.status(403).json({ success: false, message: 'Only root can send webapp broadcasts' });
      }

      if (type === 'department' && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Only admins can send department broadcasts' });
      }

      const broadcast = await Broadcast.create({
        sender: userId,
        content,
        type,
        departmentId: type === 'department' ? departmentId : undefined,
        timestamp: new Date(),
        readBy: []
      });

      const populatedBroadcast = await Broadcast.findById(broadcast._id)
        .populate('sender', 'name email')
        .populate('departmentId', 'name');

      // Emit via socket
      if (type === 'webapp') {
        io.emit('broadcast:webapp', populatedBroadcast);
      } else if (type === 'department' && departmentId) {
        io.emit('broadcast:department', { departmentId, broadcast: populatedBroadcast });
      }

      res.json({ success: true, data: populatedBroadcast });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get broadcasts for user
  getBroadcasts: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const employee = await Employee.findOne({ user: userId });

      const broadcasts = await Broadcast.find({
        $or: [
          { type: 'webapp' },
          { type: 'department', departmentId: { $in: employee?.departments || [] } }
        ]
      })
        .populate('sender', 'name email')
        .populate('departmentId', 'name')
        .sort({ timestamp: -1 })
        .limit(50);

      res.json({ success: true, data: broadcasts });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mark broadcast as read
  markAsRead: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { broadcastId } = req.params;

      const broadcast = await Broadcast.findById(broadcastId);
      if (!broadcast) {
        return res.status(404).json({ success: false, message: 'Broadcast not found' });
      }

      if (!broadcast.readBy.includes(userId)) {
        broadcast.readBy.push(userId);
        await broadcast.save();
      }

      res.json({ success: true, message: 'Marked as read' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export default broadcastController;
