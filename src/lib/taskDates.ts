/** Obsidian Tasks date range: start = 🛫 (fallback due), end = 📅 due. */
export type TaskDateRange = {
	start: Date
	end: Date
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

const START_EMOJI = /🛫\uFE0F?\s*(\d{4}-\d{2}-\d{2})/u;
const DUE_EMOJI = /📅\uFE0F?\s*(\d{4}-\d{2}-\d{2})/u;
const START_INLINE = /\[start::\s*([^\]]+)]/i;
const DUE_INLINE = /\[due::\s*([^\]]+)]/i;

export function parseIsoDate(iso: string): Date | null {
	const m = ISO.exec(iso.trim());
	if (!m) return null;
	return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function firstMatch(text: string, patterns: RegExp[]): string | null {
	for (const re of patterns) {
		const m = re.exec(text);
		if (m?.[1]) return m[1].trim();
	}
	return null;
}

/**
 * Parse explicit Tasks emoji / inline metadata dates. Returns null when no
 * start or due date is present (caller may fall back to chrono).
 */
export function parseTaskDates(text: string): TaskDateRange | null {
	const startToken = firstMatch(text, [START_EMOJI, START_INLINE]);
	const dueToken = firstMatch(text, [DUE_EMOJI, DUE_INLINE]);

	let start = startToken ? parseIsoDate(startToken) : null;
	let end = dueToken ? parseIsoDate(dueToken) : null;

	if (!start && end) start = end;
	if (start && !end) end = start;
	if (!start || !end) return null;

	return {start, end};
}

export function formatTasksDateRange(start: Date, end: Date): string {
	const iso = (d: Date) => {
		const p = (n: number) => String(n).padStart(2, "0");
		return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
	};
	const s = iso(start);
	const e = iso(end);
	if (s === e) return `🛫 ${s} 📅 ${e}`;
	return `🛫 ${s} 📅 ${e}`;
}
