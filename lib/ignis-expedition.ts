import type { CrewRecord } from "./jaguar";

export const escapeCheckpoints = [
  { name: "Crater Rim", short: "Crater", objective: "Prepare your crew and find the first safe passage.", x: 44, y: 30 },
  { name: "Ash Ridge", short: "Ridge", objective: "Verify the route through the ash field.", x: 35, y: 47 },
  { name: "Obsidian Pass", short: "Pass", objective: "Find a route across the ravines and clear your blockers.", x: 55, y: 62 },
  { name: "Lava Rift", short: "Rift", objective: "Verify the final hand-off before the crew moves to safety.", x: 73, y: 73 },
  { name: "Safe Ground", short: "Escape", objective: "All assigned missions accepted. Bring everyone home.", x: 88, y: 86 },
] as const;

// Existing accepted tasks are the source of truth. A later acceptance never
// skips unfinished work, and opening a checkpoint never records completion.
export function escapeState(tasks: CrewRecord[]) {
  const ordered = [...tasks].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const accepted = ordered.filter(task => task.data.status === "Accepted").length;
  const firstOpen = ordered.findIndex(task => task.data.status !== "Accepted");
  const complete = ordered.length > 0 && firstOpen === -1;
  const checkpointFor = (index: number) => Math.min(3, Math.floor(index * 4 / Math.max(1, ordered.length)));
  const current = complete ? 4 : checkpointFor(Math.max(0, firstOpen));
  return {
    ordered, accepted, complete, current,
    percent: ordered.length ? Math.round(accepted / ordered.length * 100) : 0,
    checkpoints: escapeCheckpoints.map((checkpoint, index) => ({
      ...checkpoint,
      tasks: ordered.filter((_, taskIndex) => checkpointFor(taskIndex) === index),
      status: index < current ? "secured" as const : index === current ? "current" as const : "locked" as const,
    })),
  };
}

// Narrative conditions follow the existing twelve-week project calendar.
// These are fictional game conditions, not real volcanic monitoring data.
export function eruptionState(now = new Date()) {
  const week = Math.max(1, Math.min(12, Math.floor((now.getTime() - Date.parse("2026-10-05T00:00:00+05:30")) / 604800000) + 1));
  const stage = week < 4 ? 0 : week < 8 ? 1 : week < 12 ? 2 : 3;
  return { week, stage, label: ["Ash rising", "Lava advancing", "Heavy ashfall", "Final evacuation"][stage] };
}
