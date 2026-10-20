import type { CrewRecord } from "./jaguar";

export type SurvivalLevel = {
  id: string; number: number; name: string; terrain: string;
  tileWidth: number; height: number; minimumTiles: number;
  overlap?: number; terrains?: readonly string[];
  smokeVents?: Readonly<Record<string,readonly {x:number;y:number}[]>>;
  missionIds?: readonly string[];
  anchors: readonly { x: number; y: number }[];
};

// Add a level here with its own terrain, natural route anchors and mission IDs.
// Unassigned existing missions belong to the opening level; no database migration
// or baked-in task artwork is required to extend the game.
export const survivalLevels: readonly SurvivalLevel[] = [{
  id: "caldera-run", number: 1, name: "The Caldera Run",
  terrain: "/ignis-enchanted-volcano.webp", tileWidth: 1980, height: 660, minimumTiles: 3,
  overlap: 320, terrains: ["/ignis-enchanted-volcano.webp", "/ignis-ash-rift.webp", "/ignis-ash-rift.webp"],
  anchors: [{x:160,y:305},{x:450,y:175},{x:735,y:325},{x:1025,y:215},{x:1290,y:325},{x:1530,y:205}],
  // Normalized positions of painted steam vents; mirrored tiles mirror these too.
  smokeVents: {
    "/ignis-enchanted-volcano.webp":[{x:.11,y:.1},{x:.285,y:.23},{x:.54,y:.32},{x:.62,y:.77},{x:.78,y:.43},{x:.86,y:.1}],
    "/ignis-ash-rift.webp":[{x:.09,y:.38},{x:.32,y:.5},{x:.365,y:.32},{x:.61,y:.46},{x:.7,y:.17},{x:.89,y:.8}],
  },
}];

export function terrainSection(level: SurvivalLevel, index: number) {
  const sources = level.terrains?.length ? level.terrains : [level.terrain];
  const variant = ((index % sources.length) + sources.length) % sources.length;
  return { source: sources[variant], mirrored: variant === 2 };
}

export function survivalRoute(tasks: CrewRecord[], level = survivalLevels[0]) {
  const ordered = [...tasks].filter(task => !level.missionIds || level.missionIds.includes(task.id))
    .sort((a,b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const variants = level.terrains?.length || 1;
  const tiles = Math.ceil(Math.max(level.minimumTiles, Math.ceil((ordered.length + 2) / level.anchors.length)) / variants) * variants;
  const advance = level.tileWidth - (level.overlap ?? 0);
  const width = tiles * advance;
  const points = Array.from({length:tiles * level.anchors.length},(_,i) => ({
    x:level.anchors[i % level.anchors.length].x + Math.floor(i / level.anchors.length) * advance,
    y:level.anchors[i % level.anchors.length].y,
  }));
  const missions = ordered.map((task,i) => ({task,point:points[i+1],pointIndex:i+1}));
  let path = `M${points[0].x} ${points[0].y}`;
  const lengths = [0];
  for(let i=1;i<points.length;i++) {
    const a=points[i-1],b=points[i],mid=(a.x+b.x)/2;
    path+=` C${mid} ${a.y} ${mid} ${b.y} ${b.x} ${b.y}`;
    let previous=a,length=lengths[i-1];
    for(let step=1;step<=30;step++) {
      const t=step/30,u=1-t;
      const next={x:u**3*a.x+3*u*u*t*mid+3*u*t*t*mid+t**3*b.x,y:u**3*a.y+3*u*u*t*a.y+3*u*t*t*b.y+t**3*b.y};
      length+=Math.hypot(next.x-previous.x,next.y-previous.y);previous=next;
    }
    lengths.push(length);
  }
  const current=ordered.findIndex(task=>task.data.status!=="Accepted");
  const complete=ordered.length>0&&current===-1;
  const crewIndex=complete?points.length-1:ordered.length?current+1:0;
  const last=points.at(-1)!;
  const loopPath=path+` C${(last.x+width+points[0].x)/2} ${last.y} ${(last.x+width+points[0].x)/2} ${points[0].y} ${width+points[0].x} ${points[0].y}`;
  return {level,ordered,tiles,width,advance,height:level.height,points,missions,path,loopPath,current,complete,
    crew:points[crewIndex],crewDistance:lengths[crewIndex]/lengths.at(-1)!*100,
    accepted:ordered.filter(task=>task.data.status==="Accepted").length};
}
