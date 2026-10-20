import { workspaceIdentity, workspaceSections, type WorkspaceView } from "../../../lib/workspace-navigation";

export const dynamicParams = false;
export function generateStaticParams() {
  return workspaceSections.map(section => ({ section }));
}
export async function generateMetadata({params}:{params:Promise<{section:string}>}) {
  const {section}=await params;
  const page=workspaceIdentity[section as WorkspaceView];
  return {title:page?`${page.label} · IGNIS`:"IGNIS"};
}
export default function WorkspaceSectionPage() { return null; }
