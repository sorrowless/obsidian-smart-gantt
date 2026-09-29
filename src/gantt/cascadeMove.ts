import {GanttTask} from "./types";
import {addDays} from "./useGanttGeometry";

/** All descendants of root (any depth), in chart order. */
export function descendantTasks(tasks: GanttTask[], rootTaskNodeId: string): GanttTask[] {
	const childrenOf = new Map<string, GanttTask[]>();
	for (const task of tasks) {
		const parentId = task.parentTaskId;
		if (!parentId) continue;
		const siblings = childrenOf.get(parentId) ?? [];
		siblings.push(task);
		childrenOf.set(parentId, siblings);
	}

	const out: GanttTask[] = [];
	const visit = (parentId: string) => {
		for (const child of childrenOf.get(parentId) ?? []) {
			out.push(child);
			if (child.taskNodeId) visit(child.taskNodeId);
		}
	};
	visit(rootTaskNodeId);
	return out;
}

/** True if `ancestorId` appears in the parentTaskId chain of `task`. */
export function isDescendantOf(
	tasks: GanttTask[],
	task: GanttTask,
	ancestorId: string,
): boolean {
	const byId = new Map(
		tasks
			.filter(t => t.taskNodeId)
			.map(t => [t.taskNodeId as string, t]),
	);
	let parentId = task.parentTaskId;
	while (parentId && byId.has(parentId)) {
		if (parentId === ancestorId) return true;
		parentId = byId.get(parentId)?.parentTaskId ?? null;
	}
	return false;
}

export function shiftByDays(task: GanttTask, deltaDays: number): { start: Date; end: Date } {
	return {
		start: addDays(task.start, deltaDays),
		end: addDays(task.end, deltaDays),
	};
}
