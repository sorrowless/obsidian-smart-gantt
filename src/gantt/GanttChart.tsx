import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {normalizeSectionColors, sectionBandBackground} from "@/lib/sectionColors";
import {GanttChangePayload, GanttTask, GanttZoom} from "./types";
import {useGanttGeometry} from "./useGanttGeometry";
import TimeAxis from "./TimeAxis";
import TaskBar, {barTone} from "./TaskBar";
import {sectionAltByRow, sectionBandsFromTasks} from "./sectionBands";
import {useNamesPaneResize} from "./useNamesPaneResize";

const AXIS_HEIGHT = 52;
const ROW_HEIGHT = 36;
const NEST_INDENT_PX = 16;
const NAMES_BASE_PADDING_PX = 14;
const OVERSCAN_PX = 240;

export interface GanttChartProps {
	tasks: GanttTask[]
	zoom: GanttZoom
	/** Omit to make the chart read-only. */
	onTaskChange?: (task: GanttTask, change: GanttChangePayload) => void | Promise<void>
	onOpenSource?: (task: GanttTask) => void | Promise<void>
	/** Sticky left column with task names. */
	showNames?: boolean
	/** Fixed height; omit to fill the parent. */
	height?: number | string
	sectionColorA?: string
	sectionColorB?: string
}

const GanttChart = (props: GanttChartProps) => {
	const {
		tasks,
		zoom,
		onTaskChange,
		onOpenSource,
		showNames,
		height,
		sectionColorA,
		sectionColorB,
	} = props;
	const geometry = useGanttGeometry(tasks, zoom);
	const scrollRef = useRef<HTMLDivElement>(null);
	const namesRef = useRef<HTMLDivElement>(null);
	const [window_, setWindow] = useState<{ fromX: number; toX: number }>({fromX: 0, toX: 1200});
	const rafPending = useRef(false);
	const {colorA, colorB} = normalizeSectionColors({sectionColorA, sectionColorB});
	const rowBackground = useCallback((alt: boolean) =>
		sectionBandBackground(alt ? colorB : colorA, alt ? "alt" : "base"),
	[colorA, colorB]);

	const updateWindow = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		setWindow(prev => {
			const fromX = Math.max(0, el.scrollLeft - OVERSCAN_PX);
			const toX = el.scrollLeft + el.clientWidth + OVERSCAN_PX;
			return (Math.abs(prev.fromX - fromX) < 40 && Math.abs(prev.toX - toX) < 40)
				? prev : {fromX, toX};
		});
	}, []);

	const onScroll = useCallback(() => {
		const el = scrollRef.current;
		if (el && namesRef.current) {
			namesRef.current.style.transform = `translateY(${-el.scrollTop}px)`;
		}
		if (rafPending.current) return;
		rafPending.current = true;
		window.requestAnimationFrame(() => {
			rafPending.current = false;
			updateWindow();
		});
	}, [updateWindow]);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		if (geometry.todayX !== null) {
			el.scrollLeft = Math.max(0, geometry.todayX - el.clientWidth / 3);
		}
		updateWindow();
	}, [zoom]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		updateWindow();
		const el = scrollRef.current;
		if (!el || typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver(updateWindow);
		ro.observe(el);
		return () => ro.disconnect();
	}, [updateWindow]);

	const today = new Date();
	const cells = geometry.cellsIn(window_.fromX, window_.toX);
	const bodyHeight = tasks.length * ROW_HEIGHT;
	const sectionBands = useMemo(() => sectionBandsFromTasks(tasks), [tasks]);
	const rowSectionAlt = useMemo(() => sectionAltByRow(tasks), [tasks]);
	const sectionStartRows = useMemo(() => new Set(sectionBands.map(b => b.startRow)), [sectionBands]);
	const {width: namesPaneWidth, resizing: resizingNames, handleProps: namesResizeHandleProps} =
		useNamesPaneResize();

	return <div
		className={["sg-chart", resizingNames ? "sg-chart--resizing-names" : ""].join(" ")}
		style={{height}}
	>
		{showNames ?
			<div className={"sg-names-pane"} style={{width: namesPaneWidth}}>
				<div className={"sg-names-pane__header"}>Tasks</div>
				<div ref={namesRef}>
					{tasks.map((t, rowIndex) =>
						<div
							key={t.id}
							className={[
								"sg-names__item",
								`sg-names__item--${barTone(t, today)}`,
							].join(" ")}
							style={{
								height: ROW_HEIGHT,
								background: rowBackground(rowSectionAlt[rowIndex]),
								paddingLeft: NAMES_BASE_PADDING_PX + (t.listDepth ?? 0) * NEST_INDENT_PX,
							}}
							onClick={() => void onOpenSource?.(t)}
							title={sectionStartRows.has(rowIndex) && t.sectionTitle
								? `${t.sectionTitle}: ${t.name}`
								: t.name}
						>
							{t.name}
						</div>
					)}
				</div>
				<div
					className={"sg-names-pane__resize"}
					role={"separator"}
					aria-orientation={"vertical"}
					aria-label={"Resize tasks pane"}
					{...namesResizeHandleProps}
				/>
			</div>
			: null}

		<div className={"sg-chart__scroll"} ref={scrollRef} onScroll={onScroll}>
			<div
				className={"sg-canvas"}
				style={{width: geometry.totalWidth, height: AXIS_HEIGHT + bodyHeight}}
			>
				<TimeAxis geometry={geometry} fromX={window_.fromX} toX={window_.toX}/>

				<div className={"sg-grid"} style={{top: AXIS_HEIGHT, height: bodyHeight}}>
					<div className={"sg-section-bands"}>
						{sectionBands.map(band =>
							<div
								key={`${band.key}:${band.startRow}`}
								className={"sg-section-band"}
								style={{
									top: band.startRow * ROW_HEIGHT,
									height: band.rowCount * ROW_HEIGHT,
									background: rowBackground(band.alt),
								}}
							/>
						)}
					</div>
					{cells.map(c => <div key={c.x}>
						{c.isWeekend ?
							<div className={"sg-grid__weekend"} style={{left: c.x, width: c.width}}/>
							: null}
						<div className={"sg-grid__line"} style={{left: c.x}}/>
					</div>)}
					{geometry.todayX !== null ?
						<div className={"sg-grid__today"} style={{left: geometry.todayX}}/>
						: null}
				</div>

				<div className={"sg-rows"} style={{top: AXIS_HEIGHT}}>
					{tasks.map((t, rowIndex) =>
						<div
							key={t.id}
							className={"sg-row"}
							style={{
								height: ROW_HEIGHT,
								background: rowBackground(rowSectionAlt[rowIndex]),
							}}
						>
							<TaskBar
								task={t}
								geometry={geometry}
								onCommit={onTaskChange}
								onOpenSource={onOpenSource}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	</div>;
};

export default GanttChart;
