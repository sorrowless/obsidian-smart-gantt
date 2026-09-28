export const NAMES_PANE_WIDTH_KEY = "smart-gantt:names-pane-width";
export const NAMES_PANE_WIDTH_DEFAULT = 200;
export const NAMES_PANE_WIDTH_MIN = 120;
export const NAMES_PANE_WIDTH_MAX = 480;

export function clampNamesPaneWidth(width: number): number {
	if (!Number.isFinite(width)) return NAMES_PANE_WIDTH_DEFAULT;
	return Math.min(NAMES_PANE_WIDTH_MAX, Math.max(NAMES_PANE_WIDTH_MIN, Math.round(width)));
}

export function readStoredNamesPaneWidth(
	storage: Pick<Storage, "getItem"> | null | undefined = typeof localStorage !== "undefined"
		? localStorage
		: null,
): number {
	if (!storage) return NAMES_PANE_WIDTH_DEFAULT;
	try {
		const raw = storage.getItem(NAMES_PANE_WIDTH_KEY);
		if (raw == null || raw === "") return NAMES_PANE_WIDTH_DEFAULT;
		return clampNamesPaneWidth(Number(raw));
	} catch {
		return NAMES_PANE_WIDTH_DEFAULT;
	}
}

export function writeStoredNamesPaneWidth(
	width: number,
	storage: Pick<Storage, "setItem"> | null | undefined = typeof localStorage !== "undefined"
		? localStorage
		: null,
): void {
	if (!storage) return;
	try {
		storage.setItem(NAMES_PANE_WIDTH_KEY, String(clampNamesPaneWidth(width)));
	} catch {
		/* ignore quota / private mode */
	}
}
