import {GanttTask} from "./types";

export type SectionBand = {
	key: string
	startRow: number
	rowCount: number
	alt: boolean
}

/** Group consecutive rows that share the same sectionKey. */
export function sectionBandsFromTasks(tasks: GanttTask[]): SectionBand[] {
	const bands: SectionBand[] = [];
	let sectionIndex = 0;
	let row = 0;

	while (row < tasks.length) {
		const key = tasks[row].sectionKey ?? "";
		let end = row + 1;
		while (end < tasks.length && (tasks[end].sectionKey ?? "") === key) {
			end += 1;
		}
		bands.push({
			key,
			startRow: row,
			rowCount: end - row,
			alt: sectionIndex % 2 === 1,
		});
		sectionIndex += 1;
		row = end;
	}

	return bands;
}

export function sectionAltByRow(tasks: GanttTask[]): boolean[] {
	const alts = new Array<boolean>(tasks.length).fill(false);
	for (const band of sectionBandsFromTasks(tasks)) {
		for (let row = band.startRow; row < band.startRow + band.rowCount; row += 1) {
			alts[row] = band.alt;
		}
	}
	return alts;
}
