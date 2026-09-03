import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {formatTasksDateRange, parseIsoDate, parseTaskDates} from "./taskDates";

const localIso = (d: Date) => {
	const p = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const iso = (s: string) => {
	const d = parseIsoDate(s);
	assert.ok(d);
	return d;
};

describe("parseTaskDates", () => {
	it("reads start and due emoji dates", () => {
		const range = parseTaskDates("Сдать анализы 🛫 2026-09-03 📅 2026-09-04");
		assert.ok(range);
		assert.equal(localIso(range.start), "2026-09-03");
		assert.equal(localIso(range.end), "2026-09-04");
	});

	it("supports same-day start and due", () => {
		const range = parseTaskDates("Пройти нарколога 🛫 2026-09-03 📅 2026-09-03");
		assert.ok(range);
		assert.equal(localIso(range.start), "2026-09-03");
		assert.equal(localIso(range.end), "2026-09-03");
	});

	it("ignores created date and uses start/due", () => {
		const range = parseTaskDates(
			"Parent ➕ 2026-08-30 🛫 2026-08-31 📅 2026-09-15",
		);
		assert.ok(range);
		assert.equal(localIso(range.start), "2026-08-31");
		assert.equal(localIso(range.end), "2026-09-15");
	});

	it("reads later dates without chrono confusion", () => {
		const range = parseTaskDates("Купить ружье 🛫 2026-09-11 📅 2026-09-13");
		assert.ok(range);
		assert.equal(localIso(range.start), "2026-09-11");
		assert.equal(localIso(range.end), "2026-09-13");
	});

	it("falls back due to start when only due is set", () => {
		const range = parseTaskDates("Task 📅 2026-09-07");
		assert.ok(range);
		assert.equal(localIso(range.start), "2026-09-07");
		assert.equal(localIso(range.end), "2026-09-07");
	});
});

describe("formatTasksDateRange", () => {
	it("writes Tasks emoji syntax", () => {
		assert.equal(
			formatTasksDateRange(iso("2026-09-03"), iso("2026-09-04")),
			"🛫 2026-09-03 📅 2026-09-04",
		);
	});
});
