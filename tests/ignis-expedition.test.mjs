import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = ts.transpileModule(readFileSync(new URL("../lib/ignis-expedition.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
new Function("exports", source)(exports);
const { escapeState, eruptionState } = exports;
const task = (i, status = "Planned") => ({ id: `mission-${String(i).padStart(3,"0")}`, createdAt: new Date(Date.UTC(2026,9,5,0,i)).toISOString(), data: {status} });

test("an empty expedition cannot claim extraction", () => {
  const route = escapeState([]);
  assert.equal(route.complete, false);
  assert.equal(route.percent, 0);
  assert.equal(route.current, 0);
  assert.equal(route.checkpoints[4].status,"locked");
});
test("out-of-order approvals never skip an uncleared checkpoint", () => {
  const tasks = Array.from({length:8},(_,i)=>task(i));
  tasks[7].data.status="Accepted";
  assert.equal(escapeState(tasks).current,0);
  tasks[0].data.status="Accepted";
  tasks[1].data.status="Accepted";
  assert.equal(escapeState(tasks).current,1);
  tasks[0].data.status="Rework";
  assert.equal(escapeState(tasks).current,0);
  assert.equal(escapeState(tasks).complete,false);
});
test("every existing mission appears once and ordering is stable", () => {
  const tasks = Array.from({length:43},(_,i)=>task(i)).reverse();
  const snapshot = tasks.map(task=>task.id);
  const route = escapeState(tasks);
  assert.equal(route.checkpoints.flatMap(point=>point.tasks).length,43);
  assert.equal(new Set(route.checkpoints.flatMap(point=>point.tasks.map(task=>task.id))).size,43);
  assert.deepEqual(tasks.map(task=>task.id),snapshot);
  assert.equal(route.ordered[0].id,"mission-000");
});
test("only accepted missions unlock extraction", () => {
  for(const status of ["Planned","In progress","Awaiting review","Blocked","Rework"]) {
    assert.equal(escapeState([task(1,status)]).complete,false);
  }
  const route=escapeState([task(0,"Accepted"),task(1,"Accepted")]);
  assert.equal(route.complete,true);
  assert.equal(route.current,4);
  assert.equal(route.percent,100);
  assert.equal(route.checkpoints[4].status,"current");
});
test("fictional eruption stages follow the project calendar at IST boundaries", () => {
  assert.equal(eruptionState(new Date("2026-10-04T18:29:59Z")).week,1);
  assert.equal(eruptionState(new Date("2026-10-25T18:30:00Z")).stage,1);
  assert.equal(eruptionState(new Date("2026-11-23T00:00:00+05:30")).stage,2);
  assert.equal(eruptionState(new Date("2026-12-21T00:00:00+05:30")).stage,3);
  assert.equal(eruptionState(new Date("2027-01-01T00:00:00Z")).week,12);
});
