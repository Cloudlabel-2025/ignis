import { MongoMemoryReplSet } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { spawn } from "node:child_process";
import { scryptSync } from "node:crypto";

// Disposable local fixtures; explicit overrides never use Atlas or AI providers.
const port = Number(process.env.IGNIS_PREVIEW_PORT || 3210);
const origin = `http://127.0.0.1:${port}`;
const replica = await MongoMemoryReplSet.create({replSet:{count:1}});
const client = await new MongoClient(replica.getUri()).connect();
const db = client.db("ignis_disposable_preview");
const now = new Date(), email = "explorer@example.com", password = "IgnisPreview@2026";
const salt = "disposable-ignis-preview";
await db.collection("approved_users").insertOne({_id:email,email,name:"IGNIS Explorer",role:"owner",active:true,passwordHash:`scrypt:${salt}:${scryptSync(password,salt,64).toString("hex")}`,passwordVersion:1,mustChangePassword:false,createdAt:now,updatedAt:now});
const titles=["Establish the radio link","Map the workforce structures","Reconcile the HDL load","Restore the approval route","Verify employee journeys","Clear the integration checkpoint","Complete the UAT hand-off","Prepare the extraction report"];
const statuses=["Accepted","Accepted","In progress","Blocked","Planned","Planned","Planned","Planned"];
const record=(id,kind,data,index=0)=>({_id:id,id,kind,author:email,data,revision:1,created_at:new Date(Date.UTC(2026,9,5,10,index)).toISOString(),updated_at:now.toISOString()});
await db.collection("crew_records").insertMany([
  ...titles.map((title,index)=>record(`ignis-preview-${index}`,"task",{title,description:"Synthetic preview mission. Verify the project work, share your checks and get the mission report accepted to advance the crew.",owner:email,dueAt:"2026-11-01T12:30:00Z",criteria:"Document the expected result, actual result and supporting evidence. Confirm the next hand-off.",status:statuses[index]},index)),
  record("ignis-hazard","raid",{type:"Issue / Blocker",title:"Approval route needs verification",detail:"Synthetic blocker: confirm the approval chain before advancing.",owner:email,status:"Open",eta:"2026-11-01T12:30:00Z"}),
  record("ignis-preview-report","evidence",{taskId:"ignis-preview-2",groupId:"ignis-preview-report",version:1,status:"Pending review",title:"HDL reconciliation report",summary:"Synthetic test: 44 department rows reconciled.",handoff:"Ready for expedition lead verification",link:"https://example.com/preview"}),
]);
await client.close();
const child=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","--hostname","127.0.0.1","--port",String(port)],{
  cwd:process.cwd(),windowsHide:true,stdio:"inherit",
  env:{...process.env,MONGODB_URI:replica.getUri(),MONGODB_DB:"ignis_disposable_preview",AUTH_SECRET:"ignis-disposable-preview-secret-only-for-local-testing",AUTH_URL:origin,JAGUAR_APP_ORIGIN:origin,OPENAI_API_KEY:"",AUTH_GOOGLE_ID:"",AUTH_GOOGLE_SECRET:"",JAGUAR_BUILD_DIR:".next-ignis-preview",NEXT_TELEMETRY_DISABLED:"1"},
});
console.log(`IGNIS disposable preview: ${origin}/signin\nFixture login: ${email} / ${password}\nAll preview data is discarded when stopped.`);
let stopping=false;
async function stop(){if(stopping)return;stopping=true;child.kill();await replica.stop();}
process.on("SIGINT",stop);process.on("SIGTERM",stop);
child.on("exit",async()=>{await stop();process.exit();});
