import assert from "node:assert/strict";
import {describe, it} from "node:test";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import {Heading} from "mdast";
import {unified} from "unified";
import {Node, Parent} from "unist";

import {
	applyHeading,
	headingText,
	sectionKeyFromStack,
} from "./headingContext";

const parseHeading = (markdown: string): Heading => {
	const tree = unified().use(remarkGfm).use(remarkParse).parse(markdown);
	let heading: Heading | undefined;
	const walk = (node: Node) => {
		if (node.type === "heading" && heading === undefined) heading = node as Heading;
		if ("children" in node) {
			for (const child of (node as Parent).children) walk(child);
		}
	};
	walk(tree);
	if (!heading) throw new Error(`no heading in ${markdown}`);
	return heading;
};

describe("headingText", () => {
	it("extracts plain heading text", () => {
		assert.equal(headingText(parseHeading("##### Общий блок")), "Общий блок");
	});
});

describe("applyHeading", () => {
	it("nests and resets heading stack by depth", () => {
		let stack = applyHeading(parseHeading("## A"), []);
		stack = applyHeading(parseHeading("### B"), stack);
		assert.deepEqual(stack, [
			{depth: 2, title: "A"},
			{depth: 3, title: "B"},
		]);

		stack = applyHeading(parseHeading("## C"), stack);
		assert.deepEqual(stack, [
			{depth: 2, title: "C"},
		]);
	});
});

describe("sectionKeyFromStack", () => {
	it("includes file path and breadcrumb titles", () => {
		const key = sectionKeyFromStack("notes/project.md", [
			{depth: 2, title: "A"},
			{depth: 3, title: "B"},
		]);
		assert.equal(key, "notes/project.md::A/B");
	});

	it("uses empty breadcrumb before the first heading", () => {
		assert.equal(sectionKeyFromStack("notes/project.md", []), "notes/project.md::");
	});
});
