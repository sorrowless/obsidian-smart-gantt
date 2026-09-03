import {Chrono, ParsedResult} from "chrono-node";
import {ListItem} from "mdast";

import {NodeFromParseTree} from "./MarkdownProcesser";
import {parseTaskDates, TaskDateRange} from "./lib/taskDates";
import {listItemText} from "./lib/taskStatus";
import {TFile} from "obsidian";
import {Node} from "unist"


export type TimelineExtractorResultNg = {
	id: string,
	node: Node,
	file: TFile,
	parsedResult: ParsedResult | null,
	taskDates: TaskDateRange | null,
	sectionKey: string,
	sectionTitle: string | null,
	sourceLine: number,
	taskNodeId: string,
	parentTaskId: string | null,
	listDepth: number,
}

export default class TimelineExtractor {
	get countResultWithChrono(): number {
		return this.#countResultWithChrono;
	}

	get customChrono(): Chrono {
		return this._customChrono;
	}


	private readonly _customChrono: Chrono;

	#countResultWithChrono = 0

	constructor(customChrono: Chrono) {
		this._customChrono = customChrono;
	}


	private makeTextCompatibleWithTaskPlugin(text: string) {
		const hourGlass = text.replace(/⏳/g, " due in "),
			airPlain = hourGlass.replace(/🛫/g, " start from "),
			heavyPlus = airPlain.replace(/➕/g, " created in "),
			checkMark = heavyPlus.replace(/✅/g, " done in "),
			crossMark = checkMark.replace(/❌/g, " cancelled in "),

			createdIn = crossMark.replace(/\[created::\s+(.*)]/g, " created in $1 "),
			scheduledIn = createdIn.replace(/\[scheduled::\s+(.*)]/g, " scheduled in $1 "),
			startFrom = scheduledIn.replace(/\[start::\s+(.*)]/g, " start from $1 "),
			dueTo = startFrom.replace(/\[due::\s+(.*)]/g, " due to $1 "),
			completionIn = dueTo.replace(/\[completion::\s+(.*)]/g, " completion in $1 "),
			cancelledIn = completionIn.replace(/\[cancelled::\s(.*)]/g, " cancelled in $1 "),

			calendarMark = cancelledIn.replace(/📅/g, " to ")

		return calendarMark

	}


	async GetTimelineDataFromNodes(nodes: NodeFromParseTree[]): Promise<TimelineExtractorResultNg[]> {
		let results: TimelineExtractorResultNg[] = []
		nodes.forEach(((node, nodeId) => {
			const rawText = listItemText(node.node as ListItem)
			const taskDates = parseTaskDates(rawText)
			let parsedResult: ParsedResult | null = null

			if (!taskDates) {
				const transformedText = this.makeTextCompatibleWithTaskPlugin(rawText)
				const parsedResults = this.customChrono.parse(transformedText)
				if (parsedResults && parsedResults.length > 0) {
					parsedResult = parsedResults.find(r => r.end) ?? parsedResults[0]
					this.#countResultWithChrono += 1
				}
			}

			if (taskDates || parsedResult) {
				results.push({
					id: `${nodeId}`,
					node: node.node,
					file: node.file,
					parsedResult,
					taskDates,
					sectionKey: node.sectionKey,
					sectionTitle: node.sectionTitle,
					sourceLine: node.sourceLine,
					taskNodeId: node.taskNodeId,
					parentTaskId: node.parentTaskId,
					listDepth: node.listDepth,
				})
			} else {
				results.push({
					id: `${nodeId}`,
					node: node.node,
					file: node.file,
					parsedResult: null,
					taskDates: null,
					sectionKey: node.sectionKey,
					sectionTitle: node.sectionTitle,
					sourceLine: node.sourceLine,
					taskNodeId: node.taskNodeId,
					parentTaskId: node.parentTaskId,
					listDepth: node.listDepth,
				})
			}
		}))
		return results

	}


}
