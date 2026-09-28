import {Heading} from "mdast";
import {Node, Parent} from "unist";

export type HeadingFrame = {
	depth: number
	title: string
}

function phrasingText(node: Node): string {
	if (node.type === "text") {
		return (node as { value?: unknown }).value as string ?? "";
	}
	if ("children" in node) {
		return (node as Parent).children.map(phrasingText).join("");
	}
	return "";
}

export function headingText(node: Heading): string {
	return node.children.map(phrasingText).join("").trim();
}

/** Replace stack frames at the same or deeper level, then push this heading. */
export function applyHeading(node: Heading, stack: HeadingFrame[]): HeadingFrame[] {
	const depth = node.depth;
	const title = headingText(node);
	const kept = stack.filter(frame => frame.depth < depth);
	return [...kept, {depth, title}];
}

export function sectionKeyFromStack(filePath: string, stack: HeadingFrame[]): string {
	return `${filePath}::${stack.map(frame => frame.title).join("/")}`;
}

export function sectionTitleFromStack(stack: HeadingFrame[]): string | null {
	return stack.length > 0 ? stack[stack.length - 1].title : null;
}
