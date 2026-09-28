import {GanttTask} from "./types";

/** Task node ids that have at least one child present in the list. */
export function parentsWithChildren(tasks: GanttTask[]): Set<string> {
	const byId = new Set(
		tasks.map(t => t.taskNodeId).filter((id): id is string => Boolean(id)),
	);
	const parents = new Set<string>();
	for (const task of tasks) {
		if (task.parentTaskId && byId.has(task.parentTaskId)) {
			parents.add(task.parentTaskId);
		}
	}
	return parents;
}

/**
 * Hide tasks whose ancestor chain includes a collapsed parent.
 * Order of remaining tasks is preserved.
 */
export function visibleGanttTasks(
	tasks: GanttTask[],
	collapsedIds: ReadonlySet<string>,
): GanttTask[] {
	if (collapsedIds.size === 0) return tasks;

	const byId = new Map(
		tasks
			.filter(t => t.taskNodeId)
			.map(t => [t.taskNodeId as string, t]),
	);

	const isHidden = (task: GanttTask): boolean => {
		let parentId = task.parentTaskId;
		while (parentId && byId.has(parentId)) {
			if (collapsedIds.has(parentId)) return true;
			parentId = byId.get(parentId)?.parentTaskId ?? null;
		}
		return false;
	};

	return tasks.filter(t => !isHidden(t));
}

/** Seed collapsed set from the default setting. */
export function initialCollapsedIds(
	tasks: GanttTask[],
	nestCollapsedByDefault: boolean,
): Set<string> {
	if (!nestCollapsedByDefault) return new Set();
	return parentsWithChildren(tasks);
}
