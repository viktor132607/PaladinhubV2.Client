
export type TalentBuildEntry = { name: string; isDefault?: boolean };
export type TalentBuildMenuBlockProps = { id?: string; treeKey?: string; builds?: TalentBuildEntry[]; selected?: string; onSelect?: (name: string) => void };
export default function TalentBuildMenuBlock({ id, treeKey = "paladin", builds = [], selected = "", onSelect }: TalentBuildMenuBlockProps) { const selectedName = selected || builds.find((build) => build.isDefault)?.name; return <section id={id} className="build-tabs flex flex-wrap gap-2" data-tree-key={treeKey}>{builds.map((build) => <button key={build.name} type="button" className={`build-tab ${selectedName === build.name ? "active" : ""}`} onClick={() => onSelect?.(build.name)}>{build.name}</button>)}</section>; }
