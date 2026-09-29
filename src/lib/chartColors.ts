import {SmartGanttSettings} from "@/SettingManager";

const HEX = /^#([0-9a-fA-F]{6})$/;

/** Preview swatch when the user has not picked a custom color yet. */
export const PREVIEW_COLOR_ACCENT = "#7c3aed";
export const PREVIEW_COLOR_DONE = "#22c55e";
export const PREVIEW_COLOR_OVERDUE = "#ef4444";

export type ChartColorOverrides = {
	accent: string | null
	done: string | null
	overdue: string | null
}

/** Empty or invalid values mean “use Obsidian theme tokens”. */
export function parseOptionalHex(value: string | undefined | null): string | null {
	const trimmed = (value ?? "").trim();
	if (!trimmed) return null;
	return HEX.test(trimmed) ? trimmed.toLowerCase() : null;
}

export function normalizeChartColors(
	settings: Partial<SmartGanttSettings> | undefined,
): ChartColorOverrides {
	return {
		accent: parseOptionalHex(settings?.colorAccent),
		done: parseOptionalHex(settings?.colorDone),
		overdue: parseOptionalHex(settings?.colorOverdue),
	};
}

/** CSS custom properties to set on `.sg-chart` when overrides are present. */
export function chartColorCssVars(overrides: ChartColorOverrides): Record<string, string> {
	const style: Record<string, string> = {};
	if (overrides.accent) {
		style["--sg-accent"] = overrides.accent;
		style["--sg-accent-hover"] = overrides.accent;
	}
	if (overrides.done) style["--sg-done"] = overrides.done;
	if (overrides.overdue) style["--sg-overdue"] = overrides.overdue;
	return style;
}
