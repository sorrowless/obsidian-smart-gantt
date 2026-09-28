import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {
	clampNamesPaneWidth,
	NAMES_PANE_WIDTH_DEFAULT,
	NAMES_PANE_WIDTH_KEY,
	NAMES_PANE_WIDTH_MAX,
	NAMES_PANE_WIDTH_MIN,
	readStoredNamesPaneWidth,
	writeStoredNamesPaneWidth,
} from "./namesPaneWidth";

describe("clampNamesPaneWidth", () => {
	it("clamps to min and max", () => {
		assert.equal(clampNamesPaneWidth(50), NAMES_PANE_WIDTH_MIN);
		assert.equal(clampNamesPaneWidth(900), NAMES_PANE_WIDTH_MAX);
		assert.equal(clampNamesPaneWidth(240), 240);
	});

	it("falls back for non-finite values", () => {
		assert.equal(clampNamesPaneWidth(Number.NaN), NAMES_PANE_WIDTH_DEFAULT);
		assert.equal(clampNamesPaneWidth(Infinity), NAMES_PANE_WIDTH_DEFAULT);
	});
});

describe("readStoredNamesPaneWidth / writeStoredNamesPaneWidth", () => {
	it("reads a clamped stored value", () => {
		const store = new Map<string, string>();
		const storage = {
			getItem: (k: string) => store.get(k) ?? null,
			setItem: (k: string, v: string) => { store.set(k, v); },
		};
		writeStoredNamesPaneWidth(50, storage);
		assert.equal(store.get(NAMES_PANE_WIDTH_KEY), String(NAMES_PANE_WIDTH_MIN));
		assert.equal(readStoredNamesPaneWidth(storage), NAMES_PANE_WIDTH_MIN);
	});

	it("returns default when missing or invalid", () => {
		const storage = {
			getItem: () => null,
		};
		assert.equal(readStoredNamesPaneWidth(storage), NAMES_PANE_WIDTH_DEFAULT);
		assert.equal(readStoredNamesPaneWidth({getItem: () => "nope"}), NAMES_PANE_WIDTH_DEFAULT);
		assert.equal(readStoredNamesPaneWidth(null), NAMES_PANE_WIDTH_DEFAULT);
	});
});
