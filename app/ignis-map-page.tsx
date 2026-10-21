"use client";
import { useTranslation } from "../components/personal-preferences";

import { useState } from "react";
import { ArrowUpRight, Check, ChevronRight, X } from "lucide-react";
import IgnisLoopMap from "./ignis-loop-map";
import { escapeState, eruptionState } from "../lib/ignis-expedition";
import { canControl, energyState, phases, type CrewRecord, type Identity } from "../lib/jaguar";
import { RiderVitals } from "./river-expedition";

type Props={user:Identity;crew:{name:string;email:string;role:Identity["role"];area:string}[];records:CrewRecord[];tasks:CrewRecord[];evidence:CrewRecord[];raids:CrewRecord[];phase:number;onPhase:(phase:number)=>void;onTasks:()=>void;onEvidence:(id:string)=>void;onReview:()=>void;onRaid:()=>void;onGuide:(id:string)=>void};

export default function IgnisMapPage({user,crew,records,tasks,evidence,raids,phase,onPhase,onTasks,onEvidence,onReview,onRaid,onGuide}:Props){
    const t = useTranslation();
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
    {levelsOpen&&<section className="ignis-map-drawer" id="ignis-level-list" aria-label={t("Levels")}><header><span>{t("LEVELS")}</span><button aria-label={t("Close levels")} onClick={()=>setLevelsOpen(false)}><X size={17}/></button></header><h2>{t("Your escape levels")}</h2><p>{t("{accepted} of {total} levels cleared.", {accepted:route.accepted,total:tasks.length})}</p><div className="ignis-drawer-missions">{route.ordered.map((task,index)=><button key={task.id} onClick={()=>{setSelectedId(task.id);setLevelsOpen(false);}}><span>{task.data.status==="Accepted"?<Check size={14}/>:String(index+1).padStart(2,"0")}</span><div><strong>{task.data.title}</strong><small>{owner(task.data.owner)} · {t(task.data.status)}</small></div><ChevronRight size={14}/></button>)}</div>{!tasks.length&&<p>{t("Your lead can create the first mission. Explore the volcanic world while you prepare at Survival Kit.")}</p>}<button className="primary" onClick={onTasks}>{t("Open Trail Challenges")} <ArrowUpRight size={14}/></button></section>}
    {selected&&<section className="ignis-map-drawer" aria-label={t("Selected mission briefing")}><header><span>{t("LEVEL")} {String(route.ordered.findIndex(task=>task.id===selected.id)+1).padStart(2,"0")} {t("BRIEFING")}</span><button aria-label={t("Close mission briefing")} onClick={()=>setSelectedId(null)}><X size={17}/></button></header><h2>{selected.data.title}</h2><span className="ignis-task-status">{t(selected.data.status)}</span><p>{selected.data.description}</p><dl><div><dt>{t("Assigned to")}</dt><dd>{owner(selected.data.owner)}</dd></div><div><dt>{t("Deadline")}</dt><dd>{date(selected.data.dueAt)}</dd></div></dl><div className="ignis-acceptance"><strong>{t("Success criteria")}</strong><p>{selected.data.criteria||t("Agree the required checks with your expedition lead.")}</p></div>{canSubmit&&<button className="primary" onClick={()=>onEvidence(selected.id)}>{t("Submit mission report")} <ArrowUpRight size={15}/></button>}<button className="ignis-navigator-link" onClick={()=>onGuide(selected.id)}>{t("Ask Ember Guide")} <ArrowUpRight size={14}/></button></section>}
    </div>
    <div className="ignis-map-explore" aria-hidden="true"/>
    <div className="ignis-map-data ignis-map-summary">
      <section className="ignis-route-progress" aria-label={t("Escape progress")}>
        <div><span className="ignis-data-eyebrow">{t("EXPEDITION STATUS")}</span><h2>{t("Every mission brings you closer.")}</h2><p>{t("{accepted} of {total} levels cleared with accepted evidence.", {accepted:route.accepted,total:tasks.length})}</p></div>
        <div className="ignis-route-meter"><strong>{route.percent}<small>%</small></strong><progress value={route.percent} max={100} aria-label={t("Accepted mission progress")}/><span>{t("Escape progress")}</span></div>
      </section>
      <div className="ignis-data-metrics" aria-label={t("Live mission totals")}>{[
        {count:outstanding.length,label:"Levels ahead",action:onTasks},
        {count:route.accepted,label:"Levels cleared",action:onTasks},
        {count:pending,label:"Reports in review",action:onReview},
        {count:hazards,label:"Open hazards",action:onRaid},
      ].map(metric=><button key={t(metric.label)} onClick={metric.action}><span><strong>{metric.count}</strong><small>{t(metric.label)}</small></span><ChevronRight size={17}/></button>)}</div>
    </div>
    </div>
    <div className="ignis-map-data">
      <div className="ignis-data-grid">
        <section className="ignis-data-panel ignis-next-briefing">
          <span className="ignis-data-eyebrow">{t("YOUR NEXT LEVEL")}</span><h2>{next?.data.title||t("Ready for the next challenge")}</h2>
          {next?<><span className="ignis-task-status">{t(next.data.status)}</span><p>{next.data.description}</p><dl><div><dt>{t("Assigned to")}</dt><dd>{owner(next.data.owner)}</dd></div><div><dt>{t("Deadline")}</dt><dd>{date(next.data.dueAt)}</dd></div></dl><div className="ignis-success-criteria"><strong>{t("How to clear this challenge")}</strong><p>{next.data.criteria||t("Agree the required checks with your expedition lead.")}</p></div><div className="ignis-data-actions"><button className="primary" onClick={()=>onEvidence(next.id)}>{t("Submit mission report")} <ArrowUpRight size={14}/></button><button onClick={()=>onGuide(next.id)}>{t("Ask Ember Guide")}</button></div></>:<p>{tasks.length?t("Your assigned missions are accepted. Check the mission board for the crew’s remaining work."):t("Your lead can add missions to begin the escape route.")}</p>}
          <button className="ignis-data-link" onClick={onTasks}>{t("View Trail Challenges")} <ArrowUpRight size={14}/></button>
        </section>
        <section className="ignis-data-panel"><div className="ignis-data-panel-heading"><h2>{t("The expedition plan")}</h2><small>{t("12 weeks")}</small></div><div className="ignis-plan-list">{phases.map((item,index)=><button key={t(item[0])} onClick={()=>onPhase(index)} aria-pressed={phase===index}><span>{String(index+1).padStart(2,"0")}</span><strong>{t(item[0])}</strong><small>{item[1]}</small><ChevronRight size={14}/></button>)}</div><p className="ignis-plan-detail"><strong>{t(phases[phase]?.[0])}</strong>{t(phases[phase]?.[2])}.</p><small className="ignis-data-note">{t("Explore the plan. Phase selection does not mark work complete.")}</small></section>
        <section className="ignis-data-panel"><div className="ignis-data-panel-heading"><h2>{t("Your level queue")}</h2><small>{assigned.length} {t("remaining")}</small></div><div className="ignis-queue">{assigned.slice(0,4).map(task=><button key={task.id} onClick={()=>setSelectedId(task.id)}><div><strong>{task.data.title}</strong><small>{owner(task.data.owner)} · {date(task.data.dueAt)}</small></div><span className="ignis-task-status">{t(task.data.status)}</span><ChevronRight size={14}/></button>)}</div>{!assigned.length&&<p>{t("No outstanding missions assigned to you.")}</p>}<button className="ignis-data-link" onClick={onTasks}>{t("Open Trail Challenges")} <ArrowUpRight size={14}/></button></section>
        <section className="ignis-data-panel"><div className="ignis-data-panel-heading"><h2>{t("Expedition crew")}</h2><small>{crew.length} {t("members")}</small></div><div className="ignis-crew-list">{crew.map(member=>{const vitals=energyState(records,member.email);return <div key={member.email}><span className="ignis-crew-initials" aria-hidden="true">{member.name.split(" ").map(part=>part[0]).slice(0,2).join("")}</span><div><strong>{member.name}</strong><small>{t(member.area||member.role.replaceAll("_"," "))}</small></div>{member.role==="learner"&&<div className="ignis-crew-vitals"><RiderVitals life={vitals.life} energy={vitals.energy}/></div>}</div>;})}</div></section>
      </div>
    </div>
  </div>;
}
