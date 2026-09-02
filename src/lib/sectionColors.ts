import {SmartGanttSettings} from "@/SettingManager";

/** Default violet tints aligned with the Smart Gantt accent. */
export const DEFAULT_SECTION_COLOR_A = "#8b5cf6";
export const DEFAULT_SECTION_COLOR_B = "#6d28d9";

export function normalizeSectionColors(settings: Partial<SmartGanttSettings> | undefined): {
	colorA: string
	colorB: string
} {
	return {
		colorA: settings?.sectionColorA?.trim() || DEFAULT_SECTION_COLOR_A,
		colorB: settings?.sectionColorB?.trim() || DEFAULT_SECTION_COLOR_B,
	};
}

/** Mix a user-picked hex into the chart surface for readable section bands. */
export function sectionBandBackground(color: string, strength: "base" | "alt"): string {
	const pct = strength === "base" ? 18 : 32;
	return `color-mix(in srgb, ${color} ${pct}%, var(--sg-surface))`;
}
