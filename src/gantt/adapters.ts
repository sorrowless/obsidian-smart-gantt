import {ListItem} from "mdast";
import type {TimelineExtractorResultNg} from "@/TimelineExtractor";
import {listItemText} from "@/lib/taskStatus";
import {finalizeGanttTasks} from "./nestedTasks";
import {GanttTask, GanttZoom} from "./types";
import {dayAnchor} from "./useGanttGeometry";

export function nodeText(node: unknown): string {
	const text = listItemText(node as ListItem).trim();
	return text || "Untitled task";
}

/** One extractor result with a parsed date becomes one bar. */
export function resultToGanttTask(r: TimelineExtractorResultNg): GanttTask | null {
	let start: Date | null = null;
	let end: Date | null = null;
	if (r.taskDates) {
		start = r.taskDates.start;
		end = r.taskDates.end;
	} else if (r.parsedResult) {
		start = r.parsedResult.start.date();
		end = r.parsedResult.end ? r.parsedResult.end.date() : start;
	}
	if (!start || !end) return null;
	if (dayAnchor(end) < dayAnchor(start)) [start, end] = [end, start];
	return {
		id: r.id,
		name: nodeText(r.node),
		start,
		end,
		status: (r.node as ListItem).checked ? "done" : "open",
		sourcePath: r.file.path,
		sectionKey: r.sectionKey,
		sectionTitle: r.sectionTitle,
		sourceLine: r.sourceLine,
		taskNodeId: r.taskNodeId,
		parentTaskId: r.parentTaskId,
		listDepth: r.listDepth,
		meta: r,
	};
}

export function sortGanttTasks(tasks: GanttTask[]): GanttTask[] {
	return [...tasks].sort((a, b) => {
		const pathCmp = (a.sourcePath ?? "").localeCompare(b.sourcePath ?? "");
		if (pathCmp !== 0) return pathCmp;
		return (a.sourceLine ?? 0) - (b.sourceLine ?? 0);
	});
}

export function resultsToGanttTasks(results: TimelineExtractorResultNg[]): GanttTask[] {
	return finalizeGanttTasks(
		sortGanttTasks(
			results
				.map(resultToGanttTask)
				.filter((t): t is GanttTask => t !== null),
		),
	);
}

/** Normalizes persisted view modes, including legacy gantt-task-react values. */
export function zoomFromSetting(value: unknown): GanttZoom {
	const v = String(value ?? "").toLowerCase();
	if (v === "week" || v === "half day" || v === "quarter day" || v === "hour") return "week";
	if (v === "month") return "month";
	if (v === "quarter" || v === "year" || v === "quarter year") return "quarter";
	return "day";
}
