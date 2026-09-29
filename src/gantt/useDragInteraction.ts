import {useCallback, useEffect, useRef, useState} from "react";
import {GanttChangePayload, GanttTask} from "./types";
import {addDays, daysBetween, GanttGeometry} from "./useGanttGeometry";

export type DragMode = "move" | "resize-start" | "resize-end"

export interface DragState {
	mode: DragMode
	deltaDays: number
}

export interface DragPreviewState {
	taskNodeId: string
	mode: DragMode
	deltaDays: number
}

/**
 * Pointer-driven move/resize with day snapping. Live preview happens via
 * the returned drag state (rendered as a transform); the commit fires once
 * on release. Escape cancels an in-flight drag.
 */
export function useDragInteraction(
	task: GanttTask,
	geometry: GanttGeometry,
	onCommit?: (task: GanttTask, change: GanttChangePayload) => void | Promise<void>,
	onDragPreview?: (state: DragPreviewState | null) => void,
) {
	const [drag, setDrag] = useState<DragState | null>(null);
	const session = useRef<{ mode: DragMode; originX: number; pointerId: number } | null>(null);
	const dragRef = useRef<DragState | null>(null);
	dragRef.current = drag;
	const onDragPreviewRef = useRef(onDragPreview);
	onDragPreviewRef.current = onDragPreview;

	const emitPreview = useCallback((state: DragState | null) => {
		const id = task.taskNodeId;
		if (!id || !onDragPreviewRef.current) return;
		if (!state) {
			onDragPreviewRef.current(null);
			return;
		}
		onDragPreviewRef.current({taskNodeId: id, mode: state.mode, deltaDays: state.deltaDays});
	}, [task.taskNodeId]);

	const begin = useCallback((mode: DragMode) => (e: React.PointerEvent) => {
		if (!onCommit) return;
		e.preventDefault();
		e.stopPropagation();
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		session.current = {mode, originX: e.clientX, pointerId: e.pointerId};
		const next = {mode, deltaDays: 0};
		setDrag(next);
		emitPreview(next);
	}, [onCommit, emitPreview]);

	const move = useCallback((e: React.PointerEvent) => {
		const s = session.current;
		if (!s || e.pointerId !== s.pointerId) return;
		const deltaDays = Math.round((e.clientX - s.originX) / geometry.spec.pxPerDay);
		setDrag(prev => {
			if (prev && prev.deltaDays === deltaDays) return prev;
			const next = {mode: s.mode, deltaDays};
			emitPreview(next);
			return next;
		});
	}, [geometry.spec.pxPerDay, emitPreview]);

	const finish = useCallback((e: React.PointerEvent) => {
		const s = session.current;
		if (!s || e.pointerId !== s.pointerId) return;
		session.current = null;
		const d = dragRef.current;
		setDrag(null);
		emitPreview(null);
		if (!d || d.deltaDays === 0 || !onCommit) return;

		let start = task.start, end = task.end;
		if (d.mode === "move") {
			start = addDays(start, d.deltaDays);
			end = addDays(end, d.deltaDays);
		} else if (d.mode === "resize-start") {
			start = addDays(start, d.deltaDays);
			if (daysBetween(start, end) < 0) start = end;
		} else {
			end = addDays(end, d.deltaDays);
			if (daysBetween(start, end) < 0) end = start;
		}
		void onCommit(task, {start, end, mode: d.mode});
	}, [task, onCommit, emitPreview]);

	useEffect(() => {
		if (!drag) return;
		const cancel = (ev: KeyboardEvent) => {
			if (ev.key === "Escape") {
				session.current = null;
				setDrag(null);
				emitPreview(null);
			}
		};
		window.addEventListener("keydown", cancel);
		return () => window.removeEventListener("keydown", cancel);
	}, [drag, emitPreview]);

	return {
		drag,
		barHandlers: {
			onPointerDown: begin("move"),
			onPointerMove: move,
			onPointerUp: finish,
			onPointerCancel: finish,
		},
		startHandleProps: {onPointerDown: begin("resize-start")},
		endHandleProps: {onPointerDown: begin("resize-end")},
	};
}
