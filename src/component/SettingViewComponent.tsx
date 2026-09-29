import {DEFAULT_SMART_GANTT_SETTINGS, SmartGanttSettings} from "../SettingManager";
import {ReactNode, useState} from "react";
import {Checkbox} from "./Checkbox";
import {Label} from "./Label";
import {RadioGroup, RadioGroupItem} from "./RadioGroup";
import SmartGanttPlugin from "../../main";
import {ScrollArea} from "./ScrollableList";
import {Button} from "./Button";
import {
	PREVIEW_COLOR_ACCENT,
	PREVIEW_COLOR_DONE,
	PREVIEW_COLOR_OVERDUE,
} from "@/lib/chartColors";
import {DEFAULT_SECTION_COLOR_A, DEFAULT_SECTION_COLOR_B} from "@/lib/sectionColors";

const SettingSection = (props: {
	title: string
	hint?: string
	children: ReactNode
}) => (
	<section className={"flex flex-col gap-3 rounded-md border border-border bg-secondary/40 p-3"}>
		<div className={"flex flex-col gap-0.5"}>
			<h3 className={"m-0 text-sm font-semibold text-foreground"}>{props.title}</h3>
			{props.hint ?
				<p className={"m-0 text-xs text-muted-foreground"}>{props.hint}</p>
				: null}
		</div>
		{props.children}
	</section>
);

const SettingRow = (props: {
	label: string
	hint?: string
	htmlFor?: string
	children: ReactNode
}) => (
	<div className={"flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4"}>
		<div className={"min-w-0 flex-1"}>
			{props.htmlFor ?
				<Label htmlFor={props.htmlFor} className={"text-sm text-foreground"}>{props.label}</Label>
				: <div className={"text-sm font-medium text-foreground"}>{props.label}</div>}
			{props.hint ?
				<p className={"m-0 mt-0.5 text-xs text-muted-foreground"}>{props.hint}</p>
				: null}
		</div>
		<div className={"flex shrink-0 items-center gap-2"}>{props.children}</div>
	</div>
);

const ColorPickerRow = (props: {
	id: string
	label: string
	hint: string
	value: string
	fallback: string
	onChange: (hex: string) => void
	onReset: () => void
}) => {
	const display = props.value.trim() || props.fallback;
	const isCustom = Boolean(props.value.trim());
	return <SettingRow label={props.label} hint={props.hint} htmlFor={props.id}>
		<input
			id={props.id}
			type={"color"}
			value={display}
			onChange={(e) => props.onChange(e.target.value)}
			className={"h-8 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"}
			title={isCustom ? props.value : `Theme default (${props.fallback})`}
		/>
		<Button
			type={"button"}
			variant={"secondary"}
			className={"h-8 px-2 text-xs"}
			disabled={!isCustom}
			onClick={props.onReset}
		>
			Reset
		</Button>
	</SettingRow>;
};

const SettingViewComponent = (props: {
	inputS: SmartGanttSettings | undefined,
	saveSettings: (s: SmartGanttSettings) => void,
	isSettingsQ: boolean,
	isSettingsQHandle: (b: boolean) => void,
	updateSettingInCodeBlockHandle?: (s: SmartGanttSettings) => void,
	thisPlugin: SmartGanttPlugin
}) => {
	const [s, setS] = useState<SmartGanttSettings>(() => ({
		...DEFAULT_SMART_GANTT_SETTINGS,
		...structuredClone(props.inputS ?? {}),
	}));

	const customPathQ = s.pathListFilter.indexOf("AllFiles") === -1 &&
		s.pathListFilter.indexOf("CurrentFile") === -1;

	const sourceValue = s.pathListFilter.indexOf("AllFiles") !== -1
		? "AllFiles"
		: s.pathListFilter.indexOf("CurrentFile") !== -1
			? "CurrentFile"
			: "CustomPath";

	return <>
		<div className={"flex flex-row justify-end gap-2 p-2"}>
			{props.isSettingsQ ?
				<Button
					variant={"secondary"}
					onClick={() => props.isSettingsQHandle(false)}
				>
					Cancel
				</Button>
				: null}
			{props.isSettingsQ ?
				<Button
					onClick={() => {
						props.isSettingsQHandle(false);
						props.saveSettings(s);
						props.updateSettingInCodeBlockHandle?.(s);
					}}
				>
					Save
				</Button>
				:
				<Button onClick={() => props.isSettingsQHandle(false)}>
					Settings
				</Button>}
		</div>

		<div className={"flex flex-col gap-4 px-2 pb-3"}>
			<SettingSection
				title={"Source"}
				hint={"Choose which notes feed tasks into this chart."}
			>
				<RadioGroup
					value={sourceValue}
					onValueChange={(e) => {
						if (e === "AllFiles" || e === "CurrentFile") {
							setS({...s, pathListFilter: [e]});
						} else if (e === "CustomPath") {
							setS({...s, pathListFilter: []});
						}
					}}
					className={"gap-3"}
				>
					<div className={"flex items-center space-x-2"}>
						<RadioGroupItem id={"allFiles"} value={"AllFiles"}/>
						<Label htmlFor={"allFiles"}>All files</Label>
					</div>
					<div className={"flex items-center space-x-2"}>
						<RadioGroupItem id={"currentFile"} value={"CurrentFile"}/>
						<Label htmlFor={"currentFile"}>Current file</Label>
					</div>
					<div className={"flex items-center space-x-2"}>
						<RadioGroupItem id={"customPath"} value={"CustomPath"}/>
						<Label htmlFor={"customPath"}>Custom folders</Label>
					</div>
				</RadioGroup>

				{customPathQ ?
					<div className={"flex justify-center"}>
						<ScrollArea className={"m-1 h-56 w-full max-w-sm rounded-md border border-border"}>
							<div className={"space-y-2 px-3 py-2"}>
								<div className={"sticky top-0 mb-2 rounded-md bg-secondary p-2 text-sm font-medium text-secondary-foreground"}>
									Folders
								</div>
								{props.thisPlugin.helper.getAllParentPath().map((path: string, pathIndex: number) =>
									<div className={"flex items-center space-x-2"} key={path}>
										<Checkbox
											id={`pathFilterRadioGanttBlock-${pathIndex}`}
											checked={s.pathListFilter.indexOf(path) !== -1}
											onCheckedChange={(e) => {
												const paths = [...s.pathListFilter];
												if (e) {
													if (paths.indexOf(path) === -1) paths.push(path);
												} else {
													const i = paths.indexOf(path);
													if (i !== -1) paths.splice(i, 1);
												}
												setS({...s, pathListFilter: paths});
											}}
										/>
										<Label htmlFor={`pathFilterRadioGanttBlock-${pathIndex}`}>{path}</Label>
									</div>
								)}
							</div>
						</ScrollArea>
					</div>
					: null}
			</SettingSection>

			<SettingSection
				title={"Task status"}
				hint={"Which checkbox states appear on the chart."}
			>
				<SettingRow
					label={"Todo / open"}
					hint={"Include unfinished tasks (including in-progress markers like [/])."}
					htmlFor={"TodoQ"}
				>
					<Checkbox
						id={"TodoQ"}
						checked={s.todoShowQ}
						onCheckedChange={(e) => setS({...s, todoShowQ: Boolean(e)})}
					/>
				</SettingRow>
				<SettingRow
					label={"Done"}
					hint={"Include completed and cancelled tasks ([x], [-])."}
					htmlFor={"DoneQ"}
				>
					<Checkbox
						id={"DoneQ"}
						checked={s.doneShowQ}
						onCheckedChange={(e) => setS({...s, doneShowQ: Boolean(e)})}
					/>
				</SettingRow>
			</SettingSection>

			<SettingSection
				title={"Display"}
				hint={"Layout of the chart panes and nested lists."}
			>
				<SettingRow
					label={"Show task list"}
					hint={"Sticky left column with task names beside the timeline."}
					htmlFor={"showtasklistinchartcheckbox"}
				>
					<Checkbox
						id={"showtasklistinchartcheckbox"}
						checked={s.leftBarChartDisplayQ}
						onCheckedChange={(e) => setS({...s, leftBarChartDisplayQ: Boolean(e)})}
					/>
				</SettingRow>
				<SettingRow
					label={"Collapse nested tasks by default"}
					hint={"Parents with subtasks start collapsed; expand with the chevron."}
					htmlFor={"nestcollapsedbydefaultcheckbox"}
				>
					<Checkbox
						id={"nestcollapsedbydefaultcheckbox"}
						checked={s.nestCollapsedByDefault}
						onCheckedChange={(e) => setS({...s, nestCollapsedByDefault: Boolean(e)})}
					/>
				</SettingRow>
			</SettingSection>

			<SettingSection
				title={"Colors"}
				hint={"Leave a color on Reset to follow your Obsidian theme. Block colors always use a plugin default until you change them."}
			>
				<ColorPickerRow
					id={"colorAccent"}
					label={"Accent"}
					hint={"Active bars, today line, open-task dots, and future bar tint."}
					value={s.colorAccent}
					fallback={PREVIEW_COLOR_ACCENT}
					onChange={(hex) => setS({...s, colorAccent: hex})}
					onReset={() => setS({...s, colorAccent: ""})}
				/>
				<ColorPickerRow
					id={"colorDone"}
					label={"Done"}
					hint={"Completed bars and list dots."}
					value={s.colorDone}
					fallback={PREVIEW_COLOR_DONE}
					onChange={(hex) => setS({...s, colorDone: hex})}
					onReset={() => setS({...s, colorDone: ""})}
				/>
				<ColorPickerRow
					id={"colorOverdue"}
					label={"Overdue"}
					hint={"Past-due open bars and list dots."}
					value={s.colorOverdue}
					fallback={PREVIEW_COLOR_OVERDUE}
					onChange={(hex) => setS({...s, colorOverdue: hex})}
					onReset={() => setS({...s, colorOverdue: ""})}
				/>
				<ColorPickerRow
					id={"sectionColorA"}
					label={"Block A"}
					hint={"Background band for even heading sections."}
					value={s.sectionColorA}
					fallback={DEFAULT_SECTION_COLOR_A}
					onChange={(hex) => setS({...s, sectionColorA: hex})}
					onReset={() => setS({...s, sectionColorA: DEFAULT_SECTION_COLOR_A})}
				/>
				<ColorPickerRow
					id={"sectionColorB"}
					label={"Block B"}
					hint={"Background band for odd heading sections."}
					value={s.sectionColorB}
					fallback={DEFAULT_SECTION_COLOR_B}
					onChange={(hex) => setS({...s, sectionColorB: hex})}
					onReset={() => setS({...s, sectionColorB: DEFAULT_SECTION_COLOR_B})}
				/>
			</SettingSection>
		</div>
	</>;
};

export default SettingViewComponent;
