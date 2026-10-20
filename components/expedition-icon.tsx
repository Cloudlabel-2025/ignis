import { Activity, BadgeCheck, Compass, Flame, MountainSnow, PackageCheck, RadioTower, Route, ScrollText, Shield } from "lucide-react";
import { workspaceIdentity, type WorkspaceView } from "../lib/workspace-navigation";
import "./expedition-icon.css";

const symbols = {
  overview: MountainSnow,
  onboarding: PackageCheck,
  project: ScrollText,
  tasks: Route,
  meetings: RadioTower,
  community: Flame,
  evidence: BadgeCheck,
  raid: Activity,
  control: Shield,
  guide: Compass,
} satisfies Record<WorkspaceView, typeof MountainSnow>;

// Page identity is shared by navigation, page headings and destination links.
// Adjacent text names the destination; the symbol stays decorative.
export function ExpeditionIcon({ destination, size = 24, className = "" }: {
  destination: WorkspaceView;
  size?: number;
  className?: string;
}) {
  const Symbol = symbols[destination];
  return <span className={`expedition-symbol ${className}`} data-destination={destination} style={{ width: size, height: size }} aria-hidden="true"><Symbol size={size} strokeWidth={1.7} /></span>;
}

export function ExpeditionPageBadge({destination,className=""}:{destination:WorkspaceView;className?:string}) {
  return <span className={`ignis-page-badge ${className}`}><ExpeditionIcon destination={destination} size={18}/><span>{workspaceIdentity[destination].label}</span><small>IGNIS</small></span>;
}
