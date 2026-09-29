import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {
	chartColorCssVars,
	normalizeChartColors,
	parseOptionalHex,
	PREVIEW_COLOR_ACCENT,
} from "./chartColors";

describe("parseOptionalHex", () => {
	it("returns null for empty or invalid values", () => {
		assert.equal(parseOptionalHex(""), null);
		assert.equal(parseOptionalHex("  "), null);
		assert.equal(parseOptionalHex("red"), null);
		assert.equal(parseOptionalHex("#fff"), null);
		assert.equal(parseOptionalHex(null), null);
	});

	it("normalizes valid hex", () => {
		assert.equal(parseOptionalHex("#7C3AED"), "#7c3aed");
		assert.equal(parseOptionalHex(" #22c55e "), "#22c55e");
	});
});

describe("normalizeChartColors", () => {
	it("treats missing fields as theme (null)", () => {
		const colors = normalizeChartColors({});
		assert.equal(colors.accent, null);
		assert.equal(colors.done, null);
		assert.equal(colors.overdue, null);
	});

	it("passes through valid hex overrides", () => {
		const colors = normalizeChartColors({
			colorAccent: PREVIEW_COLOR_ACCENT,
			colorDone: "#22c55e",
			colorOverdue: "#ef4444",
		});
		assert.equal(colors.accent, PREVIEW_COLOR_ACCENT);
		assert.equal(colors.done, "#22c55e");
		assert.equal(colors.overdue, "#ef4444");
	});
});

describe("chartColorCssVars", () => {
	it("emits only set overrides", () => {
		assert.deepEqual(chartColorCssVars({accent: null, done: null, overdue: null}), {});
		assert.deepEqual(
			chartColorCssVars({accent: "#7c3aed", done: null, overdue: "#ef4444"}),
			{
				"--sg-accent": "#7c3aed",
				"--sg-accent-hover": "#7c3aed",
				"--sg-overdue": "#ef4444",
			},
		);
	});
});
