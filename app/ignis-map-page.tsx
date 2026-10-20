"use client";

import { useState } from "react";
import { ArrowUpRight, Check, ChevronRight, X } from "lucide-react";
import IgnisLoopMap from "./ignis-loop-map";
import { escapeState, eruptionState } from "../lib/ignis-expedition";
import { canControl, energyState, phases, type CrewRecord, type Identity } from "../lib/jaguar";
import { RiderVitals } from "./river-expedition";

type Props={user:Identity;crew:{name:string;email:string;role:Identity["role"];area:string}[];records:CrewRecord[];tasks:CrewRecord[];evidence:CrewRecord[];raids:CrewRecord[];phase:number;onPhase:(phase:number)=>void;onTasks:()=>void;onEvidence:(id:string)=>void;onReview:()=>void;onRaid:()=>void;onGuide:(id:string)=>void};

export default function IgnisMapPage({user,crew,records,tasks,evidence,raids,phase,onPhase,onTasks,onEvidence,onReview,onRaid,onGuide}:Props){
  const [selectedId,setSelectedId]=useState<string|null>(null),[levelsOpen,setLevelsOpen]=useState(false);
  const route=escapeState(tasks),eruption=eruptionState();
  const selected=tasks.find(task=>task.id===selectedId);
  const canSubmit=selected&&selected.data.status!=="Accepted"&&(canControl(user)||selected.data.owner===user.email);
  const owner=(email:string)=>crew.find(member=>member.email===email)?.name??email;
  const date=(value:unknown)=>typeof value==="string"&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata"})+" IST":"Not scheduled";
  const pending=evidence.filter(record=>record.data.status==="Pending review").length;
  const hazards=raids.filter(record=>record.data.status!=="Resolved").length;
  const outstanding=route.ordered.filter(task=>task.data.status!=="Accepted");
  const assigned=outstanding.filter(task=>canControl(user)||task.data.owner===user.email);
  const next=assigned[0];
  return <div className="ignis-full-map">
    <div className="ignis-map-scene">
    <div className="ignis-map-stage">
    <IgnisLoopMap tasks={tasks} selectedId={selected?.id} stage={eruption.stage} onTasks={onTasks} levelsOpen={levelsOpen} onLevels={()=>{setLevelsOpen(!levelsOpen);setSelectedId(null);}} onSelect={id=>{setSelectedId(id);setLevelsOpen(false);}}/>
    {levelsOpen&&<section className="ignis-map-drawer" id="ignis-level-list" aria-label="Levels"><header><span>LEVELS</span><button aria-label="Close levels" onClick={()=>setLevelsOpen(false)}><X size={17}/></button></header><h2>Your escape levels</h2><p>{route.accepted} of {tasks.length} levels cleared.</p><div className="ignis-drawer-missions">{route.ordered.map((task,index)=><button key={task.id} onClick={()=>{setSelectedId(task.id);setLevelsOpen(false);}}><span>{task.data.status==="Accepted"?<Check size={14}/>:String(index+1).padStart(2,"0")}</span><div><strong>{task.data.title}</strong><small>{owner(task.data.owner)} · {task.data.status}</small></div><ChevronRight size={14}/></button>)}</div>{!tasks.length&&<p>Your lead can create the first mission. Explore the volcanic world while you prepare at Survival Kit.</p>}<button className="primary" onClick={onTasks}>Open Trail Challenges <ArrowUpRight size={14}/></button></section>}
    {selected&&<section className="ignis-map-drawer" aria-label="Selected mission briefing"><header><span>LEVEL {String(route.ordered.findIndex(task=>task.id===selected.id)+1).padStart(2,"0")} BRIEFING</span><button aria-label="Close mission briefing" onClick={()=>setSelectedId(null)}><X size={17}/></button></header><h2>{selected.data.title}</h2><span className="ignis-task-status">{selected.data.status}</span><p>{selected.data.description}</p><dl><div><dt>Assigned to</dt><dd>{owner(selected.data.owner)}</dd></div><div><dt>Deadline</dt><dd>{date(selected.data.dueAt)}</dd></div></dl><div className="ignis-acceptance"><strong>Success criteria</strong><p>{selected.data.criteria||"Agree the required checks with your expedition lead."}</p></div>{canSubmit&&<button className="primary" onClick={()=>onEvidence(selected.id)}>Submit mission report <ArrowUpRight size={15}/></button>}<button className="ignis-navigator-link" onClick={()=>onGuide(selected.id)}>Ask Ember Guide <ArrowUpRight size={14}/></button></section>}
    </div>
    <div className="ignis-map-explore" aria-hidden="true"/>
    <div className="ignis-map-data ignis-map-summary">
      <section className="ignis-route-progress" aria-label="Escape progress">
        <div><span className="ignis-data-eyebrow">EXPEDITION STATUS</span><h2>Every mission brings you closer.</h2><p>{route.accepted} of {tasks.length} levels cleared with accepted evidence.</p></div>
        <div className="ignis-route-meter"><strong>{route.percent}<small>%</small></strong><progress value={route.percent} max={100} aria-label="Accepted mission progress"/><span>Escape progress</span></div>
      </section>
      <div className="ignis-data-metrics" aria-label="Live mission totals">{[
        {count:outstanding.length,label:"Levels ahead",action:onTasks},
        {count:route.accepted,label:"Levels cleared",action:onTasks},
        {count:pending,label:"Reports in review",action:onReview},
        {count:hazards,label:"Open hazards",action:onRaid},
      ].map(metric=><button key={metric.label} onClick={metric.action}><span><strong>{metric.count}</strong><small>{metric.label}</small></span><ChevronRight size={17}/></button>)}</div>
    </div>
    </div>
    <div className="ignis-map-data">
      <div className="ignis-data-grid">
        <section className="ignis-data-panel ignis-next-briefing">
          <span className="ignis-data-eyebrow">YOUR NEXT LEVEL</span><h2>{next?.data.title||"Ready for the next challenge"}</h2>
          {next?<><span className="ignis-task-status">{next.data.status}</span><p>{next.data.description}</p><dl><div><dt>Assigned to</dt><dd>{owner(next.data.owner)}</dd></div><div><dt>Deadline</dt><dd>{date(next.data.dueAt)}</dd></div></dl><div className="ignis-success-criteria"><strong>How to clear this challenge</strong><p>{next.data.criteria||"Agree the required checks with your expedition lead."}</p></div><div className="ignis-data-actions"><button className="primary" onClick={()=>onEvidence(next.id)}>Submit mission report <ArrowUpRight size={14}/></button><button onClick={()=>onGuide(next.id)}>Ask Ember Guide</button></div></>:<p>{tasks.length?"Your assigned missions are accepted. Check the mission board for the crew’s remaining work.":"Your lead can add missions to begin the escape route."}</p>}
          <button className="ignis-data-link" onClick={onTasks}>View Trail Challenges <ArrowUpRight size={14}/></button>
        </section>
        <section className="ignis-data-panel"><div className="ignis-data-panel-heading"><h2>The expedition plan</h2><small>12 weeks</small></div><div className="ignis-plan-list">{phases.map((item,index)=><button key={item[0]} onClick={()=>onPhase(index)} aria-pressed={phase===index}><span>{String(index+1).padStart(2,"0")}</span><strong>{item[0]}</strong><small>{item[1]}</small><ChevronRight size={14}/></button>)}</div><p className="ignis-plan-detail"><strong>{phases[phase]?.[0]}</strong>{phases[phase]?.[2]}.</p><small className="ignis-data-note">Explore the plan. Phase selection does not mark work complete.</small></section>
        <section className="ignis-data-panel"><div className="ignis-data-panel-heading"><h2>Your level queue</h2><small>{assigned.length} remaining</small></div><div className="ignis-queue">{assigned.slice(0,4).map(task=><button key={task.id} onClick={()=>setSelectedId(task.id)}><div><strong>{task.data.title}</strong><small>{owner(task.data.owner)} · {date(task.data.dueAt)}</small></div><span className="ignis-task-status">{task.data.status}</span><ChevronRight size={14}/></button>)}</div>{!assigned.length&&<p>No outstanding missions assigned to you.</p>}<button className="ignis-data-link" onClick={onTasks}>Open Trail Challenges <ArrowUpRight size={14}/></button></section>
        <section className="ignis-data-panel"><div className="ignis-data-panel-heading"><h2>Expedition crew</h2><small>{crew.length} members</small></div><div className="ignis-crew-list">{crew.map(member=>{const vitals=energyState(records,member.email);return <div key={member.email}><span className="ignis-crew-initials" aria-hidden="true">{member.name.split(" ").map(part=>part[0]).slice(0,2).join("")}</span><div><strong>{member.name}</strong><small>{member.area||member.role.replaceAll("_"," ")}</small></div>{member.role==="learner"&&<div className="ignis-crew-vitals"><RiderVitals life={vitals.life} energy={vitals.energy}/></div>}</div>;})}</div></section>
      </div>
    </div>
  </div>;
}
