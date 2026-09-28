import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {GanttTask} from "./types";
import {assignNestGroups, orderNestedGanttTasks} from "./nestedTasks";

const task = (
	id: string,
	overrides: Partial<GanttTask> = {},
): GanttTask => ({
	id,
	name: id,
	start: new Date(2024, 0, 1),
	end: new Date(2024, 0, 2),
	status: "open",
	taskNodeId: id,
	sourceLine: Number(id.replace(/\D/g, "")) || 1,
	sectionKey: "note.md::Block",
	...overrides,
});

describe("orderNestedGanttTasks", () => {
	it("places subtasks immediately after their parent", () => {
		const ordered = orderNestedGanttTasks([
			task("1", {sourceLine: 1, parentTaskId: null}),
			task("2", {sourceLine: 3, parentTaskId: null}),
			task("1a", {sourceLine: 2, parentTaskId: "1", listDepth: 1}),
		]);
		assert.deepEqual(ordered.map(t => t.id), ["1", "1a", "2"]);
	});
});

describe("assignNestGroups", () => {
	it("groups parents with visible subtasks", () => {
		const grouped = assignNestGroups([
			task("1", {parentTaskId: null}),
			task("1a", {parentTaskId: "1", listDepth: 1}),
		]);
		assert.equal(grouped[0].nestGroupId, "1");
		assert.equal(grouped[1].nestGroupId, "1");
	});

	it("leaves standalone tasks ungrouped", () => {
		const grouped = assignNestGroups([
			task("1", {parentTaskId: null}),
		]);
		assert.equal(grouped[0].nestGroupId, null);
	});
});
