import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

const source=ts.transpileModule(readFileSync(new URL("../components/survival-effects.tsx",import.meta.url),"utf8"),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},
}).outputText;

test("effects tolerate a zero-sized viewport before loading, while hidden, and after disposal",async()=>{
  const globals=["document","Image","ResizeObserver","IntersectionObserver","requestAnimationFrame","cancelAnimationFrame","devicePixelRatio"];
  const previous=new Map(globals.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  const resizeCallbacks=[];const listeners=new Map();let bounds={width:0,height:0},draws=0,cleanup;
  const gradient={addColorStop(){}};
  function canvas(){
    const element={width:300,height:150};
    const context=new Proxy({
      drawImage(image){if(!image.width||!image.height)throw new Error("InvalidStateError: zero-sized canvas source");draws++;},
      getImageData(){return {data:new Uint8ClampedArray(element.width*element.height*4)};},
      createLinearGradient(){return gradient;},createRadialGradient(){return gradient;},
    },{get(target,key){return key in target?target[key]:()=>{};}});
    element.getContext=()=>context;return element;
  }
  const surface=canvas();
  const region={getBoundingClientRect:()=>bounds,scrollLeft:0,scrollTop:0,addEventListener:(key,callback)=>listeners.set(key,callback),removeEventListener:key=>listeners.delete(key)};
  try{
    Object.assign(globalThis,{
      document:{createElement:()=>canvas(),hidden:false},devicePixelRatio:1,
      Image:class{width=24;height=8;set src(_value){queueMicrotask(()=>this.onload?.());}},
      ResizeObserver:class{constructor(callback){resizeCallbacks.push(callback);}observe(){}disconnect(){}},
      IntersectionObserver:class{observe(){}disconnect(){}},
      requestAnimationFrame:()=>1,cancelAnimationFrame(){},
    });
    const exports={};
    const require=name=>{
      if(name==="react")return {useRef:()=>({current:surface}),useEffect:effect=>{cleanup=effect();}};
      if(name==="react/jsx-runtime")return {jsx:()=>null};
      if(name.includes("ignis-levels"))return {terrainSection:()=>({source:"fixture.webp",mirrored:false})};
      if(name.includes("ignis-lava"))return {isMolten:()=>false,lavaPools:()=>[]};
      throw new Error(`Unexpected import: ${name}`);
    };
    new Function("require","exports",source)(require,exports);
    exports.SurvivalEffects({viewport:{current:region},level:{tileWidth:24,height:8,terrain:"fixture.webp"},zoom:1,running:false});
    await new Promise(resolve=>setImmediate(resolve));
    bounds={width:640,height:360};resizeCallbacks[0]();const visibleDraws=draws;
    assert.ok(visibleDraws>0,"drawing resumes once the viewport is visible");
    bounds={width:0,height:360};resizeCallbacks[0]();listeners.get("scroll")?.();
    bounds={width:640,height:0};resizeCallbacks[0]();listeners.get("scroll")?.();
    bounds={width:.2,height:.2};resizeCallbacks[0]();
    assert.equal(draws,visibleDraws,"hidden and subpixel viewports must not composite canvas sources");
    bounds={width:800,height:500};resizeCallbacks[0]();assert.ok(draws>visibleDraws,"animation can recover after hiding");
    cleanup();const stoppedDraws=draws;resizeCallbacks[0]();assert.equal(draws,stoppedDraws,"late observer callbacks cannot render after disposal");
  }finally{
    cleanup?.();for(const key of globals){const descriptor=previous.get(key);if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});

test("visible vent smoke rises and changes shape across animation frames",()=>{
  const keys=["document","ResizeObserver","IntersectionObserver","requestAnimationFrame","cancelAnimationFrame","devicePixelRatio"];
  const previous=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  let cleanup,nextFrame;const clouds=[];
  const gradient={addColorStop(){}};
  const makeCanvas=()=>({width:640,height:360,getContext:()=>new Proxy({
    createRadialGradient(...position){clouds.push(position);return gradient;},
  },{get:(target,key)=>key in target?target[key]:()=>{}})});
  const surface=makeCanvas();
  const region={scrollLeft:0,scrollTop:0,getBoundingClientRect:()=>({width:640,height:360}),addEventListener(){},removeEventListener(){}};
  try{
    Object.assign(globalThis,{
      document:{hidden:false,createElement:makeCanvas},devicePixelRatio:1,
      ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}},
      requestAnimationFrame:callback=>{nextFrame=callback;return 1;},cancelAnimationFrame(){},
    });
    const exports={};
    const require=name=>{
      if(name==="react")return {useRef:()=>({current:surface}),useEffect:effect=>{cleanup=effect();}};
      if(name==="react/jsx-runtime")return {jsx:()=>null};
      if(name.includes("ignis-levels"))return {terrainSection:()=>({source:"fixture.webp",mirrored:false})};
      if(name.includes("ignis-lava"))return {};
      throw new Error(`Unexpected import: ${name}`);
    };
    new Function("require","exports",source)(require,exports);
    // No image assets are required for smoke to animate. Skip the async mask
    // loader and exercise the real requestAnimationFrame drawing path.
    const imageDescriptor=Object.getOwnPropertyDescriptor(globalThis,"Image");
    Object.defineProperty(globalThis,"Image",{configurable:true,writable:true,value:class{set src(_value){}}});
    try{
      exports.SurvivalEffects({viewport:{current:region},level:{tileWidth:660,height:360,terrain:"fixture.webp",smokeVents:{"fixture.webp":[{x:.5,y:.7}]}},zoom:1,running:true});
      clouds.length=0;nextFrame(1000);const first=clouds.map(position=>[...position]);
      clouds.length=0;nextFrame(1100);const second=clouds.map(position=>[...position]);
      assert.ok(first.length>0,"visible smoke is drawn at a configured vent");
      assert.equal(second.length,first.length);
      assert.notDeepEqual(second,first,"billow positions and radii must change with elapsed time");
      cleanup();clouds.length=0;nextFrame(1200);assert.equal(clouds.length,0,"disposed smoke must stop drawing");
    }finally{if(imageDescriptor)Object.defineProperty(globalThis,"Image",imageDescriptor);else delete globalThis.Image;}
  }finally{
    cleanup?.();for(const key of keys){const descriptor=previous.get(key);if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});
