import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {GanttTask} from "./types";
import {
	initialCollapsedIds,
	parentsWithChildren,
	visibleGanttTasks,
} from "./collapseTasks";

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
	...overrides,
});

describe("parentsWithChildren", () => {
	it("finds parents that have children in the list", () => {
		const parents = parentsWithChildren([
			task("1", {parentTaskId: null}),
			task("1a", {parentTaskId: "1", listDepth: 1}),
			task("2", {parentTaskId: null}),
		]);
		assert.deepEqual([...parents], ["1"]);
	});
});

describe("visibleGanttTasks", () => {
	it("hides descendants of a collapsed parent", () => {
		const tasks = [
			task("1", {parentTaskId: null}),
			task("1a", {parentTaskId: "1", listDepth: 1}),
			task("1a1", {parentTaskId: "1a", listDepth: 2}),
			task("2", {parentTaskId: null}),
		];
		const visible = visibleGanttTasks(tasks, new Set(["1"]));
		assert.deepEqual(visible.map(t => t.id), ["1", "2"]);
	});

	it("hides only under the collapsed ancestor in a deep nest", () => {
		const tasks = [
			task("1", {parentTaskId: null}),
			task("1a", {parentTaskId: "1", listDepth: 1}),
			task("1a1", {parentTaskId: "1a", listDepth: 2}),
		];
		const visible = visibleGanttTasks(tasks, new Set(["1a"]));
		assert.deepEqual(visible.map(t => t.id), ["1", "1a"]);
	});

	it("leaves standalone tasks unchanged", () => {
		const tasks = [task("1"), task("2")];
		assert.deepEqual(
			visibleGanttTasks(tasks, new Set(["1"])).map(t => t.id),
			["1", "2"],
		);
	});
});

describe("initialCollapsedIds", () => {
	it("returns empty when default is expanded", () => {
		const ids = initialCollapsedIds([
			task("1"),
			task("1a", {parentTaskId: "1", listDepth: 1}),
		], false);
		assert.equal(ids.size, 0);
	});

	it("collapses all parents when default is collapsed", () => {
		const ids = initialCollapsedIds([
			task("1"),
			task("1a", {parentTaskId: "1", listDepth: 1}),
			task("1a1", {parentTaskId: "1a", listDepth: 2}),
		], true);
		assert.ok(ids.has("1"));
		assert.ok(ids.has("1a"));
	});
});
