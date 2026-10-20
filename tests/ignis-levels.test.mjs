import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source=ts.transpileModule(readFileSync(new URL("../lib/ignis-levels.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};new Function("exports",source)(exports);
const {survivalRoute,survivalLevels}=exports;
const task=(i,status="Planned")=>({id:`mission-${i}`,createdAt:new Date(Date.UTC(2026,9,5,0,i)).toISOString(),data:{status}});
test("the wilderness is long, empty routes do not claim victory",()=>{
  const route=survivalRoute([]);assert.ok(route.width>=4980);assert.equal(route.complete,false);assert.equal(route.crewDistance,0);assert.equal(route.missions.length,0);
});
test("new missions extend the world without moving existing challenge locations",()=>{
  const original=Array.from({length:8},(_,i)=>task(i));const small=survivalRoute(original);const long=survivalRoute(Array.from({length:70},(_,i)=>task(i)));
  assert.equal(long.missions.length,70);assert.ok(long.width>small.width);assert.deepEqual(long.missions.slice(0,8).map(m=>m.point),small.missions.map(m=>m.point));
  for(const mission of long.missions){assert.ok(mission.point.x>0&&mission.point.x<long.width);assert.ok(mission.point.y>0&&mission.point.y<long.height);}
});
test("accepted reports advance the crew while out-of-order and rework preserve the gate",()=>{
  const missions=[task(0),task(1),task(2,"Accepted")];const initial=survivalRoute(missions);assert.equal(initial.current,0);
  missions[0].data.status="Accepted";const advanced=survivalRoute(missions);assert.equal(advanced.current,1);assert.ok(advanced.crewDistance>initial.crewDistance);
  missions[0].data.status="Rework";assert.equal(survivalRoute(missions).current,0);
  missions.forEach(m=>m.data.status="Accepted");const complete=survivalRoute(missions);assert.equal(complete.complete,true);assert.equal(complete.crewDistance,100);assert.deepEqual(complete.crew,complete.points.at(-1));
});
test("future levels select only their assigned missions and retain their own terrain",()=>{
  const tasks=[task(0),task(1),task(2)];const level={...survivalLevels[0],id:"future-rift",number:2,terrain:"/future-rift.webp",missionIds:["mission-1"]};const route=survivalRoute(tasks,level);
  assert.deepEqual(route.ordered.map(task=>task.id),["mission-1"]);assert.equal(route.level.terrain,"/future-rift.webp");assert.equal(tasks.length,3);
});
test("the loop ends on a complete texture cycle and connects to the next route copy",()=>{
  for(const count of [0,8,17,40,70]){
    const route=survivalRoute(Array.from({length:count},(_,i)=>task(i)));
    assert.equal(route.tiles%(route.level.terrains?.length||1),0);
    assert.equal(route.width,route.tiles*(route.level.tileWidth-route.level.overlap));
    assert.ok(route.loopPath.endsWith(`${route.width+route.points[0].x} ${route.points[0].y}`));
  }
});
