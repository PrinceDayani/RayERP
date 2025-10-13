import { logger } from './logger';

export const safeEmit = async (event: string, data: any) => {
  try {
    const { io } = await import('../server');
    io.emit(event, data);
    logger.info(`Socket event emitted: ${event}`);
  } catch (error) {
    logger.error(`Failed to emit socket event ${event}:`, error);
  }
};

export const safeEmitToRoom = async (room: string, event: string, data: any) => {
  try {
    const { io } = await import('../server');
    io.to(room).emit(event, data);
    logger.info(`Socket event emitted to room ${room}: ${event}`);
  } catch (error) {
    logger.error(`Failed to emit socket event ${event} to room ${room}:`, error);
  }
};

export const emitProjectStats = async () => {
  try {
    const Project = (await import('../models/Project')).default;
    const Task = (await import('../models/Task')).default;
    
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'active' });
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    const overdueTasks = await Task.countDocuments({ 
      dueDate: { $lt: new Date() }, 
      status: { $ne: 'completed' } 
    });
    
    const stats = {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueTasks,
      totalTasks: await Task.countDocuments(),
      completedTasks: await Task.countDocuments({ status: 'completed' })
    };
    
    await safeEmit('project:stats', stats);
    return stats;
  } catch (error) {
    logger.error('Error emitting project stats:', error);
    return null;
  }
};