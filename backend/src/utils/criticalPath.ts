//path: backend/src/utils/criticalPath.ts
//
// Critical path analysis over task dependencies. Works in whole-day offsets
// from a project anchor date, then converts back to dates at the edges.

const HOURS_PER_WORKING_DAY = 8;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type DependencyType =
  | 'finish-to-start'
  | 'start-to-start'
  | 'finish-to-finish'
  | 'start-to-finish';

export interface CpmTaskInput {
  _id: any;
  title: string;
  status?: string;
  estimatedHours?: number | null;
  durationDays?: number | null;
  scheduledStart?: Date | string | null;
  dependencies?: { taskId: any; type?: DependencyType }[];
}

export interface CpmTaskResult {
  id: string;
  title: string;
  durationDays: number;
  earliestStart: Date;
  earliestFinish: Date;
  latestStart: Date;
  latestFinish: Date;
  totalFloat: number;
  isCritical: boolean;
}

export interface CpmResult {
  tasks: CpmTaskResult[];
  criticalPath: string[];
  projectDurationDays: number;
  projectStart: Date;
  projectFinish: Date;
  // Ids that could not be scheduled because they sit on a dependency cycle.
  cyclicTaskIds: string[];
  // Tasks with no explicit duration, whose duration was assumed. Surfaced so a
  // caller can tell a real critical path from one produced by missing data.
  assumedDurationTaskIds: string[];
}

// Explicit durationDays wins; otherwise estimatedHours converts at an 8-hour
// day. A task with neither is treated as one day so it does not collapse to
// zero and land on the critical path for the wrong reason.
export const resolveDurationDays = (
  task: CpmTaskInput
): { days: number; assumed: boolean } => {
  if (typeof task.durationDays === 'number' && task.durationDays > 0) {
    return { days: task.durationDays, assumed: false };
  }
  const hours = task.estimatedHours || 0;
  if (hours > 0) {
    return { days: Math.max(1, Math.ceil(hours / HOURS_PER_WORKING_DAY)), assumed: false };
  }
  return { days: 1, assumed: true };
};

const addDays = (base: Date, days: number): Date =>
  new Date(base.getTime() + days * MS_PER_DAY);

const dayOffset = (base: Date, date: Date): number =>
  Math.round((date.getTime() - base.getTime()) / MS_PER_DAY);

/**
 * Standard forward/backward pass CPM.
 *
 * Dependency semantics, for a task B that lists A as a dependency:
 *   finish-to-start   B starts after A finishes
 *   start-to-start    B starts no earlier than A starts
 *   finish-to-finish  B finishes no earlier than A finishes
 *   start-to-finish   B finishes no earlier than A starts
 *
 * Tasks on a dependency cycle cannot be ordered, so they are reported in
 * cyclicTaskIds and excluded rather than looping forever.
 */
export const calculateCriticalPath = (
  tasks: CpmTaskInput[],
  anchorDate: Date = new Date()
): CpmResult => {
  const anchor = new Date(anchorDate);
  anchor.setHours(0, 0, 0, 0);

  const nodes = new Map<
    string,
    {
      input: CpmTaskInput;
      duration: number;
      assumed: boolean;
      pinnedStart: number | null;
      deps: { id: string; type: DependencyType }[];
      es: number;
      ef: number;
      ls: number;
      lf: number;
    }
  >();

  for (const task of tasks) {
    const id = task._id.toString();
    const { days, assumed } = resolveDurationDays(task);
    const pinned = task.scheduledStart ? dayOffset(anchor, new Date(task.scheduledStart)) : null;

    nodes.set(id, {
      input: task,
      duration: days,
      assumed,
      pinnedStart: pinned,
      deps: [],
      es: 0,
      ef: 0,
      ls: 0,
      lf: 0
    });
  }

  // Only dependencies pointing at tasks in this set are meaningful.
  for (const task of tasks) {
    const node = nodes.get(task._id.toString())!;
    for (const dep of task.dependencies || []) {
      if (!dep?.taskId) continue;
      const depId = (dep.taskId._id || dep.taskId).toString();
      if (nodes.has(depId)) {
        node.deps.push({ id: depId, type: dep.type || 'finish-to-start' });
      }
    }
  }

  // Kahn topological sort over dependency -> dependent edges.
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const id of nodes.keys()) {
    indegree.set(id, 0);
    dependents.set(id, []);
  }
  for (const [id, node] of nodes) {
    indegree.set(id, node.deps.length);
    for (const dep of node.deps) dependents.get(dep.id)!.push(id);
  }

  const queue = [...nodes.keys()].filter(id => indegree.get(id) === 0);
  const ordered: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    ordered.push(id);
    for (const dependent of dependents.get(id)!) {
      indegree.set(dependent, indegree.get(dependent)! - 1);
      if (indegree.get(dependent) === 0) queue.push(dependent);
    }
  }

  const cyclicTaskIds = [...nodes.keys()].filter(id => !ordered.includes(id));

  // Forward pass.
  for (const id of ordered) {
    const node = nodes.get(id)!;
    let earliestStart = node.pinnedStart ?? 0;

    for (const dep of node.deps) {
      const predecessor = nodes.get(dep.id)!;
      let required: number;
      switch (dep.type) {
        case 'start-to-start':
          required = predecessor.es;
          break;
        case 'finish-to-finish':
          required = predecessor.ef - node.duration;
          break;
        case 'start-to-finish':
          required = predecessor.es - node.duration;
          break;
        default:
          required = predecessor.ef;
      }
      if (required > earliestStart) earliestStart = required;
    }

    node.es = earliestStart;
    node.ef = earliestStart + node.duration;
  }

  const projectFinishOffset = ordered.length
    ? Math.max(...ordered.map(id => nodes.get(id)!.ef))
    : 0;

  // Backward pass, in reverse topological order.
  for (const id of [...ordered].reverse()) {
    const node = nodes.get(id)!;
    const successors = dependents.get(id)!.filter(sid => ordered.includes(sid));

    if (successors.length === 0) {
      node.lf = projectFinishOffset;
    } else {
      node.lf = Math.min(
        ...successors.map(sid => {
          const successor = nodes.get(sid)!;
          const link = successor.deps.find(d => d.id === id)!;
          switch (link.type) {
            case 'start-to-start':
              return successor.ls + node.duration;
            case 'finish-to-finish':
              return successor.lf;
            case 'start-to-finish':
              return successor.lf + node.duration;
            default:
              return successor.ls;
          }
        })
      );
    }

    node.ls = node.lf - node.duration;
  }

  const results: CpmTaskResult[] = ordered.map(id => {
    const node = nodes.get(id)!;
    const totalFloat = node.ls - node.es;
    return {
      id,
      title: node.input.title,
      durationDays: node.duration,
      earliestStart: addDays(anchor, node.es),
      earliestFinish: addDays(anchor, node.ef),
      latestStart: addDays(anchor, node.ls),
      latestFinish: addDays(anchor, node.lf),
      totalFloat,
      isCritical: totalFloat <= 0
    };
  });

  const criticalPath = results
    .filter(r => r.isCritical)
    .sort((a, b) => a.earliestStart.getTime() - b.earliestStart.getTime())
    .map(r => r.id);

  return {
    tasks: results,
    criticalPath,
    projectDurationDays: projectFinishOffset,
    projectStart: anchor,
    projectFinish: addDays(anchor, projectFinishOffset),
    cyclicTaskIds,
    assumedDurationTaskIds: ordered.filter(id => nodes.get(id)!.assumed)
  };
};
