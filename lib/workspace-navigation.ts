export const workspaceSections = [
  "overview", "onboarding", "project", "tasks", "meetings", "community",
  "evidence", "raid", "control", "guide",
] as const;
export type WorkspaceView = typeof workspaceSections[number];
export const workspaceIdentity = {
  overview: {label:"Caldera Map",detail:"Live escape route"},
  onboarding: {label:"Survival Kit",detail:"Equipment & readiness"},
  project: {label:"Escape Protocol",detail:"Objectives & operation scope"},
  tasks: {label:"Trail Challenges",detail:"Clear the next passage"},
  meetings: {label:"Signal Relay",detail:"Crew briefings & recordings"},
  community: {label:"Ember Circle",detail:"Discoveries & crew support"},
  evidence: {label:"Checkpoint Logs",detail:"Proof & mentor verification"},
  raid: {label:"Eruption Watch",detail:"Hazards & route decisions"},
  control: {label:"Survival Command",detail:"Lives, rules & scenario control"},
  guide: {label:"Ember Guide",detail:"Your expedition AI guide"},
} satisfies Record<WorkspaceView,{label:string;detail:string}>;
export function workspacePath(view: WorkspaceView) { return `/${view}`; }
export function safeWorkspaceReturn(value: string | null) {
  return value && workspaceSections.some(section => workspacePath(section) === value) ? value : "/";
}
