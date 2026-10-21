"use client";
import { useTranslation } from "../components/personal-preferences";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { Check, ChevronLeft, ChevronRight, Compass, Flame, Footprints, LockKeyhole, Mountain, ShieldAlert } from "lucide-react";
import { useReducedMotion } from "../components/personal-preferences";
import { survivalLevels, survivalRoute, terrainSection } from "../lib/ignis-levels";
import { SurvivalEffects } from "../components/survival-effects";
import type { CrewRecord } from "../lib/jaguar";

type Props={tasks:CrewRecord[];selectedId?:string;stage:number;onSelect:(id:string)=>void;onTasks:()=>void;onLevels:()=>void;levelsOpen:boolean};

export default function IgnisLoopMap({tasks,selectedId,stage,onSelect,onTasks,onLevels,levelsOpen}:Props){
    const t = useTranslation();
  const [levelId,setLevelId]=useState(survivalLevels[0].id);
  const level=survivalLevels.find(item=>item.id===levelId)??survivalLevels[0];
  // Keep challenge markers above the dashboard while the same animated terrain
  // continues behind the progress and stat cards.
  const route=survivalRoute(tasks,level);
  const futurePass=route.points[Math.min(route.missions.length+1,route.points.length-1)];
  const viewport=useRef<HTMLDivElement>(null);
  const drag=useRef({active:false,moved:false,x:0,scroll:0});
  const [fit,setFit]=useState(1);
  // Environmental motion is always on. The system preference only controls
  // smooth navigation; it does not stop the volcano or expose a pause toggle.
  const reduced=useReducedMotion(),running=!reduced;
  const scale=fit,crewX=route.crew.x,crewY=route.crew.y;
  const centerAt=useCallback((x:number,y=crewY,smooth=true)=>{
    const region=viewport.current;if(region)region.scrollTo({left:(route.width+x)*scale-region.clientWidth/2,top:y*scale-region.clientHeight/2,behavior:smooth&&!reduced?"smooth":"instant"});
  },[route.width,scale,reduced,crewY]);
  useEffect(()=>{const frame=requestAnimationFrame(()=>centerAt(crewX,crewY,false));return()=>cancelAnimationFrame(frame);},[crewX,crewY,centerAt]);
  useEffect(()=>{
    const region=viewport.current;if(!region)return;
    const resize=()=>setFit(Math.max(.65,region.clientHeight/level.height));
    const observer=new ResizeObserver(resize);observer.observe(region);resize();return()=>observer.disconnect();
  },[level.height]);
  useEffect(()=>{
    const region=viewport.current;if(!region)return;
    const update=()=>{
      const period=route.width*scale,previous=region.scrollLeft;
      // Identical adjoining world copies let the camera wrap without a visible
      // jump. Only rendering repeats; task records and completion stay unique.
      if(previous<period)region.scrollLeft=previous+period;
      else if(previous>=period*2)region.scrollLeft=previous-period;
      const delta=region.scrollLeft-previous;if(drag.current.active)drag.current.scroll+=delta;
    };
    const observer=new ResizeObserver(update);observer.observe(region);region.addEventListener("scroll",update,{passive:true});
    return()=>{observer.disconnect();region.removeEventListener("scroll",update);};
  },[route.width,scale]);
  const pan=(direction:number)=>{const region=viewport.current;if(region)region.scrollBy({left:direction*region.clientWidth*.7,behavior:reduced?"instant":"smooth"});};
  const down=(event:PointerEvent<HTMLDivElement>)=>{if(event.pointerType!=="mouse"||event.button!==0||(event.target as HTMLElement).closest("button"))return;drag.current={active:true,moved:false,x:event.clientX,scroll:event.currentTarget.scrollLeft};event.currentTarget.setPointerCapture(event.pointerId);event.currentTarget.dataset.dragging="true";};
  const move=(event:PointerEvent<HTMLDivElement>)=>{if(!drag.current.active)return;const distance=event.clientX-drag.current.x;if(Math.abs(distance)>4)drag.current.moved=true;event.currentTarget.scrollLeft=drag.current.scroll-distance;};
  const up=(event:PointerEvent<HTMLDivElement>)=>{drag.current.active=false;event.currentTarget.dataset.dragging="false";if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);};

  return <div className="survival-map survival-loop-map" data-running={running} style={{"--map-marker-scale":1/scale} as CSSProperties}>
    <header className="survival-hud"><div className="survival-region-heading"><h2>{t(level.name)}</h2><span>{t("{accepted} of {total} levels cleared.", {accepted:route.accepted,total:route.ordered.length})}</span></div><div className="survival-map-tools"><button onClick={()=>centerAt(crewX)} aria-label={t("Locate crew")}><Compass size={16}/><span>{t("Find crew")}</span></button><button onClick={onLevels} aria-expanded={levelsOpen} aria-controls="ignis-level-list">{t("Levels")} <span>{route.ordered.length}</span><ChevronRight size={14}/></button></div></header>
    {survivalLevels.length>1&&<label className="survival-loop-levels">{t("Volcanic region")}<select value={levelId} onChange={event=>{setLevelId(event.target.value);onSelect("");}}>{survivalLevels.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    <div className="survival-camera">
      <div ref={viewport} className="survival-viewport" tabIndex={0} role="region" aria-label={t("Looping volcanic survival map. Drag, swipe or use the arrow keys to explore.")} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClickCapture={event=>{if(drag.current.moved){event.preventDefault();event.stopPropagation();drag.current.moved=false;}}} onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();pan(event.key==="ArrowLeft"?-1:1);}if(event.key==="Home"){event.preventDefault();centerAt(crewX);}}}>
        <div className="survival-world-size" style={{width:route.width*3*scale,height:route.height*scale}}><div className="survival-world" style={{width:route.width*3,height:route.height,transform:`scale(${scale})`}}>
          {Array.from({length:route.tiles*3+2},(_,index)=>{const section=index-1,art=terrainSection(level,section);return <div className="survival-terrain-section" key={section} style={{left:section*route.advance,width:level.tileWidth,height:level.height,maskImage:`linear-gradient(90deg,transparent,black ${(level.overlap??0)/level.tileWidth*100}%,black)`}}><div style={{backgroundImage:`url('${art.source}')`,transform:art.mirrored?"scaleX(-1)":undefined}}/></div>;})}
          {[0,1,2].map(copy=><div className="survival-world-copy" key={copy} style={{left:copy*route.width,width:route.width,height:route.height}}>
            <svg className="survival-route" width={route.width} height={route.height} viewBox={`0 0 ${route.width} ${route.height}`} aria-hidden="true"><path d={route.loopPath} className="survival-route-shadow"/><path d={route.loopPath} className="survival-route-guide"/><path d={route.path} pathLength="100" strokeDasharray={`${route.crewDistance} 100`} className="survival-route-cleared"/></svg>
            <div className="survival-endpoint start" style={{left:route.points[0].x,top:route.points[0].y}}><Mountain size={20}/><strong>{t("CRATER RIM")}</strong><small>{t("The escape begins")}</small></div>
            {route.missions.map(({task,point},index)=>{const accepted=task.data.status==="Accepted",blocked=task.data.status==="Blocked",current=index===route.current;return <button key={task.id} tabIndex={copy===1?0:-1} className={`survival-challenge ${accepted?"accepted":""} ${blocked?"blocked":""} ${current?"current":""} ${selectedId===task.id?"selected":""}`} style={{left:point.x,top:point.y}} aria-label={`${copy===1?"":"Continuation of "}Level ${index+1}: ${task.data.title}. ${task.data.status}`} aria-pressed={selectedId===task.id} aria-current={current?"step":undefined} onClick={()=>{onSelect(task.id);centerAt(point.x,point.y);}} onFocus={event=>{if(event.currentTarget.matches(":focus-visible"))centerAt(point.x,point.y);}}><span className="survival-challenge-base"/><span className="survival-challenge-pin">{accepted?<Check size={24}/>:blocked?<ShieldAlert size={23}/>:String(index+1).padStart(2,"0")}</span><span className="survival-challenge-label"><strong>{task.data.title}</strong><small>{accepted?t("SECURED"):blocked?t("BLOCKED"):current?t("CURRENT LEVEL"):t("UPCOMING LEVEL")}</small></span></button>;})}
            {route.ordered.length>0&&<div className="survival-crew" style={{offsetPath:`path('${route.path}')`,offsetDistance:`${route.crewDistance}%`}} aria-hidden="true"><span className="survival-crew-beacon"/><span className="survival-crew-tag"><Footprints size={12}/>{route.complete?t("CREW SAFE"):t("YOUR CREW")}</span></div>}
            <div className="survival-future-pass" style={{left:futurePass.x,top:futurePass.y}} role="note" aria-label={t("Locked path. Future levels coming soon.")}>
              <div className="survival-future-mist" aria-hidden="true"/>
              <div className="survival-future-trail" aria-hidden="true"><i/><i/><i/></div>
              <div className="survival-future-gate" aria-hidden="true"><span className="survival-gate-rock left"/><span className="survival-gate-rock right"/><span className="survival-gate-bar"/><span className="survival-gate-lock"><LockKeyhole size={24}/></span></div>
              <div className="survival-future-caption"><span>{t("PATH LOCKED")}</span><strong>{t("Coming soon")}</strong><small>{t("Future levels lie beyond")}</small></div>
            </div>
          </div>)}
        </div></div>
      </div>
      <SurvivalEffects viewport={viewport} level={level} zoom={scale} running={running}/><div className="survival-edge-shade" aria-hidden="true"/>
      <div className="survival-world-status"><Flame size={13}/><span>{["Active eruption","Lava advancing","Heavy ashfall","Final evacuation"][stage]??t("Active eruption")}</span><small>{route.accepted} / {route.ordered.length} {t("MISSIONS ACCEPTED")}</small></div>
      <button className="survival-pan previous" aria-label={t("Earlier challenges")} onClick={()=>pan(-1)}><ChevronLeft size={21}/></button><button className="survival-pan next" aria-label={t("Later challenges")} onClick={()=>pan(1)}><ChevronRight size={21}/></button>
      {!route.ordered.length&&<div className="survival-empty"><Mountain size={28}/><h3>{t("The mountain is awake.")}</h3><p>{t("Explore the world while your lead prepares the first mission.")}</p><button onClick={onTasks}>{t("Open missions")} <ChevronRight size={15}/></button></div>}
    </div>
    <p className="sr-only" role="status">{route.complete?t("All current missions accepted. More challenges coming soon."):route.current>=0?t("Your crew is at level {level}: {title}", {level:route.current+1,title:route.ordered[route.current].data.title}):t("Waiting for missions. The world can already be explored.")}</p>
  </div>;
}
