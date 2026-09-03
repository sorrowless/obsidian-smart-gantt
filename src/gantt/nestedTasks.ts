import {GanttTask} from "@/gantt/types";

const bySourceLine = (a: GanttTask, b: GanttTask) =>
	(a.sourceLine ?? 0) - (b.sourceLine ?? 0);

/** DFS pre-order within each heading section: parent, then subtasks. */
export function orderNestedGanttTasks(tasks: GanttTask[]): GanttTask[] {
	const sectionOrder: string[] = [];
	const bySection = new Map<string, GanttTask[]>();

	for (const task of tasks) {
		const key = task.sectionKey ?? "";
		if (!bySection.has(key)) {
			sectionOrder.push(key);
			bySection.set(key, []);
		}
		bySection.get(key)!.push(task);
	}

	const ordered: GanttTask[] = [];
	for (const key of sectionOrder) {
		ordered.push(...orderSectionNested(bySection.get(key)!));
	}
	return ordered;
}

function orderSectionNested(tasks: GanttTask[]): GanttTask[] {
	const byId = new Map(
		tasks
			.filter(t => t.taskNodeId)
			.map(t => [t.taskNodeId as string, t]),
	);
	const childrenOf = new Map<string, GanttTask[]>();
	const roots: GanttTask[] = [];

	for (const task of tasks) {
		const parentId = task.parentTaskId;
		if (parentId && byId.has(parentId)) {
			const siblings = childrenOf.get(parentId) ?? [];
			siblings.push(task);
			childrenOf.set(parentId, siblings);
		} else {
			roots.push(task);
		}
	}

	roots.sort(bySourceLine);
	for (const children of childrenOf.values()) {
		children.sort(bySourceLine);
	}

	const ordered: GanttTask[] = [];
	const visit = (task: GanttTask) => {
		ordered.push(task);
		for (const child of childrenOf.get(task.taskNodeId ?? "") ?? []) {
			visit(child);
		}
	};
	for (const root of roots) visit(root);
	return ordered;
}

/**
 * Parent + subtasks share a nestGroupId for bar tinting. Standalone tasks
 * without subtasks in the chart stay ungrouped.
 */
export function assignNestGroups(tasks: GanttTask[]): GanttTask[] {
	const byId = new Map(
		tasks
			.filter(t => t.taskNodeId)
			.map(t => [t.taskNodeId as string, t]),
	);
	const hasChildInChart = new Set<string>();
	for (const task of tasks) {
		if (task.parentTaskId && byId.has(task.parentTaskId)) {
			hasChildInChart.add(task.parentTaskId);
		}
	}

	const rootFor = (task: GanttTask): string | null => {
		if (!task.taskNodeId) return null;
		if (hasChildInChart.has(task.taskNodeId)) return task.taskNodeId;

		let parentId = task.parentTaskId;
		while (parentId && byId.has(parentId)) {
			if (hasChildInChart.has(parentId)) return parentId;
			parentId = byId.get(parentId)?.parentTaskId ?? null;
		}
		return null;
	};

	return tasks.map(task => ({
		...task,
		nestGroupId: rootFor(task),
	}));
}

export function finalizeGanttTasks(tasks: GanttTask[]): GanttTask[] {
	return assignNestGroups(orderNestedGanttTasks(tasks));
}
