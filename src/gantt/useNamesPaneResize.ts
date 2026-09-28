import {useCallback, useRef, useState} from "react";
import {
	clampNamesPaneWidth,
	readStoredNamesPaneWidth,
	writeStoredNamesPaneWidth,
} from "./namesPaneWidth";

/**
 * Drag the names-pane right edge to resize. Width is persisted in localStorage.
 */
export function useNamesPaneResize() {
	const [width, setWidth] = useState(() => readStoredNamesPaneWidth());
	const [resizing, setResizing] = useState(false);
	const session = useRef<{ originX: number; originWidth: number; pointerId: number } | null>(null);
	const widthRef = useRef(width);
	widthRef.current = width;

	const onPointerDown = useCallback((e: React.PointerEvent) => {
		e.preventDefault();
		e.stopPropagation();
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		session.current = {
			originX: e.clientX,
			originWidth: widthRef.current,
			pointerId: e.pointerId,
		};
		setResizing(true);
	}, []);

	const onPointerMove = useCallback((e: React.PointerEvent) => {
		const s = session.current;
		if (!s || e.pointerId !== s.pointerId) return;
		const next = clampNamesPaneWidth(s.originWidth + (e.clientX - s.originX));
		setWidth(prev => (prev === next ? prev : next));
	}, []);

	const onPointerUp = useCallback((e: React.PointerEvent) => {
		const s = session.current;
		if (!s || e.pointerId !== s.pointerId) return;
		session.current = null;
		setResizing(false);
		writeStoredNamesPaneWidth(widthRef.current);
	}, []);

	return {
		width,
		resizing,
		handleProps: {
			onPointerDown,
			onPointerMove,
			onPointerUp,
			onPointerCancel: onPointerUp,
		},
	};
}
