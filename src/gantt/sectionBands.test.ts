import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {GanttTask} from "./types";
import {sectionAltByRow, sectionBandsFromTasks} from "./sectionBands";

const task = (sectionKey: string, sourceLine = 1): GanttTask => ({
	id: sectionKey,
	name: sectionKey,
	start: new Date(2024, 0, 1),
	end: new Date(2024, 0, 2),
	status: "open",
	sectionKey,
	sourceLine,
});

describe("sectionBandsFromTasks", () => {
	it("groups consecutive rows with the same sectionKey", () => {
		const bands = sectionBandsFromTasks([
			task("a::Block 1", 1),
			task("a::Block 1", 2),
			task("a::Block 2", 3),
		]);
		assert.deepEqual(bands, [
			{key: "a::Block 1", startRow: 0, rowCount: 2, alt: false},
			{key: "a::Block 2", startRow: 2, rowCount: 1, alt: true},
		]);
	});

	it("alternates alt bands by section order", () => {
		const bands = sectionBandsFromTasks([
			task("a::One"),
			task("a::Two"),
			task("a::Three"),
		]);
		assert.deepEqual(bands.map(b => b.alt), [false, true, false]);
	});
});

describe("sectionAltByRow", () => {
	it("marks rows inside alternating bands", () => {
		const alts = sectionAltByRow([
			task("a::Block 1"),
			task("a::Block 1"),
			task("a::Block 2"),
		]);
		assert.deepEqual(alts, [false, false, true]);
	});
});
