import {TFile} from "obsidian";
import SmartGanttPlugin from "../main";
import {SmartGanttSettings} from "./SettingManager";
import {Processor, unified} from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import {Node, Parent} from "unist"
import {Heading, ListItem} from "mdast"
import {
	applyHeading,
	HeadingFrame,
	sectionKeyFromStack,
	sectionTitleFromStack,
} from "./lib/headingContext";
import {taskStatusFromListItem} from "./lib/taskStatus";

export type NodeFromParseTree = {
	node: Node,
	file: TFile,
	sectionKey: string,
	sectionTitle: string | null,
	sourceLine: number,
	taskNodeId: string,
	parentTaskId: string | null,
	listDepth: number,
}

type FileWalkState = {
	headingStack: HeadingFrame[]
	listDepth: number
	parentByDepth: (string | null)[]
}

export default class MarkdownProcesser {
	get nodes(): NodeFromParseTree[] {
		return this._nodes;
	}

	private _remarkProcessor: Processor;

	get currentPlugin(): SmartGanttPlugin {
		return this._currentPlugin;
	}

	private _files: TFile[];
	private _currentPlugin: SmartGanttPlugin;

	private _nodes: NodeFromParseTree[] = [];

	constructor(files: TFile[],
				currentPlugin: SmartGanttPlugin
	) {
		this._files = files;
		this._currentPlugin = currentPlugin;
		//@ts-ignore
		this._remarkProcessor = unified().use(remarkGfm).use(remarkParse)
	}

	private recursiveGetListItemFromParseTree(node: Node
		, file: TFile
		, settings: SmartGanttSettings
		, state: FileWalkState) {

		if (node.type == "listItem") {
			const listItem = node as ListItem
			const status = taskStatusFromListItem(listItem)

			if (status !== null) {
				listItem.checked = status === "done"
				if ((settings.doneShowQ && status === "done") ||
					(settings.todoShowQ && status === "open")) {
					const sourceLine = node.position?.start.line ?? 0
					const taskNodeId = `${file.path}::${sourceLine}`
					const parentTaskId = state.listDepth > 0
						? state.parentByDepth[state.listDepth - 1] ?? null
						: null
					state.parentByDepth[state.listDepth] = taskNodeId
					state.parentByDepth.length = state.listDepth + 1

					this.nodes.push({
						node,
						file,
						sectionKey: sectionKeyFromStack(file.path, state.headingStack),
						sectionTitle: sectionTitleFromStack(state.headingStack),
						sourceLine,
						taskNodeId,
						parentTaskId,
						listDepth: state.listDepth,
					})
				}
			}
		}
		if ("children" in node) {
			let headingStack = state.headingStack;
			for (const childNode of (node as Parent).children) {
				if (childNode.type === "heading") {
					headingStack = applyHeading(childNode as Heading, headingStack);
				} else if (childNode.type === "list") {
					this.recursiveGetListItemFromParseTree(childNode, file, settings, {
						...state,
						headingStack,
						listDepth: state.listDepth + 1,
					})
				} else {
					this.recursiveGetListItemFromParseTree(childNode, file, settings, {
						...state,
						headingStack,
					})
				}
			}
		}
	}

	private async parseFilesAndUpdateTokensNg(file: TFile, settings: SmartGanttSettings) {
		if (!file) return
		const fileContent = await this.currentPlugin.app.vault.cachedRead(file)
		const parseTree: Node = this._remarkProcessor.parse(fileContent)
		this.recursiveGetListItemFromParseTree(parseTree, file, settings, {
			headingStack: [],
			listDepth: -1,
			parentByDepth: [],
		})

	}


	async parseAllFilesNg(settings: SmartGanttSettings) {
		this._nodes = []
		const pathFilterSettings = settings.pathListFilter
		await Promise.all(this._files.map(async (file) => {
			if (pathFilterSettings.includes("CurrentFile")) {
				if (this._currentPlugin.app.workspace.getActiveFile()?.name !== file.name) return
			} else if (!pathFilterSettings.includes("AllFiles") &&
				!pathFilterSettings.includes(file.parent?.path ?? "")) {
				return
			}
			await this.parseFilesAndUpdateTokensNg(file, settings)
		}))
	}


}
