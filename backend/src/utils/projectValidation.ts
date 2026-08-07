//path: backend/src/utils/projectValidation.ts

import mongoose from 'mongoose';
import Project from '../models/Project';

// Legal project status moves. Permissive enough not to obstruct normal work,
// but blocks nonsense like completed -> planning. Archived is a terminal-ish
// state that can still be brought back to any working state.
const PROJECT_STATUS_TRANSITIONS: Record<string, string[]> = {
  planning: ['active', 'on-hold', 'cancelled', 'archived'],
  active: ['on-hold', 'completed', 'cancelled', 'archived'],
  'on-hold': ['planning', 'active', 'completed', 'cancelled', 'archived'],
  completed: ['active', 'archived'],
  cancelled: ['planning', 'archived'],
  archived: ['planning', 'active', 'on-hold', 'completed', 'cancelled']
};

export const isValidProjectStatusTransition = (from: string, to: string): boolean => {
  if (from === to) return true;
  return (PROJECT_STATUS_TRANSITIONS[from] || []).includes(to);
};

export const allowedProjectStatusTransitions = (from: string): string[] =>
  PROJECT_STATUS_TRANSITIONS[from] || [];

// Walks the dependency graph from each proposed dependency. Project.dependencies
// means "this project depends on these", so reaching projectId again closes a
// cycle. Task-level dependencies already had this check; project-level did not.
export const findProjectDependencyCycle = async (
  projectId: string,
  dependencyIds: (string | mongoose.Types.ObjectId)[]
): Promise<string | null> => {
  const target = projectId.toString();

  const queue = dependencyIds
    .filter(id => mongoose.Types.ObjectId.isValid(id.toString()))
    .map(id => id.toString());

  if (queue.includes(target)) return target;

  const visited = new Set<string>([target]);

  while (queue.length) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const current = await Project.findById(currentId).select('dependencies').lean();
    if (!current?.dependencies?.length) continue;

    for (const dep of current.dependencies) {
      const depId = dep.toString();
      if (depId === target) return currentId;
      if (!visited.has(depId)) queue.push(depId);
    }
  }

  return null;
};
