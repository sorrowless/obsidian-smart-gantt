import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {GanttTask} from "./types";
import {descendantTasks, isDescendantOf, shiftByDays} from "./cascadeMove";

const d = (iso: string) => {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)!;
	return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

const task = (
	id: string,
	overrides: Partial<GanttTask> = {},
): GanttTask => ({
	id,
	name: id,
	start: d("2024-01-01"),
	end: d("2024-01-02"),
	status: "open",
	taskNodeId: id,
	...overrides,
});

describe("descendantTasks", () => {
	it("returns all nesting levels under a root", () => {
		const tasks = [
			task("1", {parentTaskId: null}),
			task("1a", {parentTaskId: "1", listDepth: 1}),
			task("1a1", {parentTaskId: "1a", listDepth: 2}),
			task("1b", {parentTaskId: "1", listDepth: 1}),
			task("2", {parentTaskId: null}),
		];
		assert.deepEqual(
			descendantTasks(tasks, "1").map(t => t.id),
			["1a", "1a1", "1b"],
		);
	});

	it("returns empty when the root has no children", () => {
		assert.deepEqual(descendantTasks([task("1"), task("2")], "1"), []);
	});
});

describe("isDescendantOf", () => {
	it("detects nested ancestry", () => {
		const tasks = [
			task("1", {parentTaskId: null}),
			task("1a", {parentTaskId: "1", listDepth: 1}),
			task("1a1", {parentTaskId: "1a", listDepth: 2}),
		];
		assert.equal(isDescendantOf(tasks, tasks[2], "1"), true);
		assert.equal(isDescendantOf(tasks, tasks[2], "1a"), true);
		assert.equal(isDescendantOf(tasks, tasks[1], "1a1"), false);
	});
});

describe("shiftByDays", () => {
	it("shifts start and end by the same delta", () => {
		const shifted = shiftByDays(
			task("1", {start: d("2024-01-01"), end: d("2024-01-15")}),
			4,
		);
		assert.equal(shifted.start.getDate(), 5);
		assert.equal(shifted.end.getDate(), 19);
	});
});
