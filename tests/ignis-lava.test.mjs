import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const source=ts.transpileModule(readFileSync(new URL("../lib/ignis-lava.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};new Function("exports",source)(exports);
const {isMolten,lavaPools}=exports;
test("lava effects exclude rock, snow, smoke and orange reflections",()=>{
  for(const rgb of [[72,55,61],[173,105,78],[218,160,122],[255,220,170],[255,250,235],[232,228,223],[245,155,110]])assert.equal(isMolten(...rgb),false,`not molten: ${rgb}`);
  for(const rgb of [[255,180,34],[250,130,20],[245,170,44]])assert.equal(isMolten(...rgb),true,`molten core: ${rgb}`);
});
test("a bubble requires a liquid neighborhood, never a single hot pixel or rock edge",()=>{
  const width=90,height=60,mask=new Uint8Array(width*height);
  mask[25*width+26]=255;assert.equal(lavaPools(mask,width,height).length,0);
  for(let y=22;y<55;y++)for(let x=20;x<65;x++)mask[y*width+x]=255;
  const pools=lavaPools(mask,width,height);assert.ok(pools.length>0);
  for(const pool of pools){const x=Math.round(pool.x*width),y=Math.round(pool.y*height);for(const dy of [-7,0,7])for(const dx of [-7,0,7])assert.equal(mask[(y+dy)*width+x+dx],255);}
});
