import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {DEFAULT_SECTION_COLOR_A, normalizeSectionColors, sectionBandBackground} from "./sectionColors";

describe("normalizeSectionColors", () => {
	it("falls back to plugin defaults", () => {
		const colors = normalizeSectionColors({});
		assert.equal(colors.colorA, DEFAULT_SECTION_COLOR_A);
	});
});

describe("sectionBandBackground", () => {
	it("uses a stronger mix for alternate blocks", () => {
		const base = sectionBandBackground("#ff0000", "base");
		const alt = sectionBandBackground("#ff0000", "alt");
		assert.notEqual(base, alt);
		assert.match(base, /color-mix/);
	});
});
