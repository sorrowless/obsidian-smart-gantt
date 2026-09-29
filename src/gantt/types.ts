export type GanttTaskStatus = "open" | "done"

export interface GanttTask {
	id: string
	name: string
	/** Inclusive first day of the bar. */
	start: Date
	/** Inclusive last day of the bar; always >= start. */
	end: Date
	status: GanttTaskStatus
	/** Vault path of the source line, when the task came from a note. */
	sourcePath?: string
	/** Stable key for heading-based section bands within a file. */
	sectionKey?: string
	/** Nearest heading title above the task, when present. */
	sectionTitle?: string | null
	/** 1-based source line for stable ordering. */
	sourceLine?: number
	/** Stable id for this checkbox line within the vault. */
	taskNodeId?: string
	/** Parent task id when nested under another checkbox task. */
	parentTaskId?: string | null
	/** 0 = top-level list item, 1 = first nested level, etc. */
	listDepth?: number
	/** Shared id for parent + subtask bar tinting; null for standalone tasks. */
	nestGroupId?: string | null
	/** Surface-specific payload carried through untouched. */
	meta?: unknown
}

export type GanttZoom = "day" | "week" | "month" | "quarter"

export interface GanttChangePayload {
	start: Date
	end: Date
	mode: "move" | "resize-start" | "resize-end"
}
