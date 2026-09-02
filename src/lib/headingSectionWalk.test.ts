import assert from "node:assert/strict";
import {describe, it} from "node:test";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import {Heading, ListItem} from "mdast";
import {unified} from "unified";
import {Node, Parent} from "unist";

import {
	applyHeading,
	sectionKeyFromStack,
	sectionTitleFromStack,
} from "./headingContext";
import {taskStatusFromListItem} from "./taskStatus";

/** Mirrors MarkdownProcesser walk: heading context threads across siblings. */
function collectTaskSections(markdown: string, filePath = "note.md") {
	const tree = unified().use(remarkGfm).use(remarkParse).parse(markdown);
	const rows: { sectionKey: string; sectionTitle: string | null; line: number }[] = [];

	const walk = (node: Node, headingStack: Parameters<typeof sectionKeyFromStack>[1]) => {
		if (node.type === "listItem") {
			const status = taskStatusFromListItem(node as ListItem);
			if (status !== null) {
				rows.push({
					sectionKey: sectionKeyFromStack(filePath, headingStack),
					sectionTitle: sectionTitleFromStack(headingStack),
					line: node.position?.start.line ?? 0,
				});
			}
		}
		if ("children" in node) {
			let stack = headingStack;
			for (const child of (node as Parent).children) {
				if (child.type === "heading") {
					stack = applyHeading(child as Heading, stack);
				}
				walk(child, stack);
			}
		}
	};

	walk(tree, []);
	return rows;
}

describe("heading section walk", () => {
	it("assigns sibling lists to the nearest preceding heading", () => {
		const rows = collectTaskSections(`##### Общий блок
- [ ] Задача раз
- [ ] Задача два

##### Еще блок
- [ ] Задача три
- [ ] Задача четыре
`);
		assert.equal(rows.length, 4);
		assert.equal(rows[0].sectionTitle, "Общий блок");
		assert.equal(rows[2].sectionTitle, "Еще блок");
		assert.notEqual(rows[0].sectionKey, rows[2].sectionKey);
	});
});
