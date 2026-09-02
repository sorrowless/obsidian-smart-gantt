import {Chrono, ParsedResult} from "chrono-node";

import {NodeFromParseTree} from "./MarkdownProcesser";
import {TFile} from "obsidian";
import {Node, Parent} from "unist"


export type TimelineExtractorResultNg = {
	id: string,
	node: Node,
	file: TFile,
	parsedResult: ParsedResult | null,
	sectionKey: string,
	sectionTitle: string | null,
	sourceLine: number,
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
			const paragraph = (node.node as Parent).children?.[0] as Parent | undefined
			const firstChild = paragraph?.children?.[0] as { value?: unknown } | undefined
			const rawText = typeof firstChild?.value === "string" ? firstChild.value : ""
			let transformedText = this.makeTextCompatibleWithTaskPlugin(rawText)
			const parsedResults = this.customChrono.parse(transformedText)
			if (parsedResults && parsedResults.length > 0) {
				const best = parsedResults.find(r => r.end) ?? parsedResults[0]
				this.#countResultWithChrono += 1
				results.push({
					id: `${nodeId}`,
					node: node.node,
					file: node.file,
					parsedResult: best,
					sectionKey: node.sectionKey,
					sectionTitle: node.sectionTitle,
					sourceLine: node.sourceLine,
				})
			} else {
				results.push({
					id: `${nodeId}`,
					node: node.node,
					file: node.file,
					parsedResult: null,
					sectionKey: node.sectionKey,
					sectionTitle: node.sectionTitle,
					sourceLine: node.sourceLine,
				})
			}
		}))
		return results

	}


}
