"use client";

import { useEffect, useRef, type RefObject } from "react";
import { terrainSection, type SurvivalLevel } from "../lib/ignis-levels";
import { isMolten, lavaPools } from "../lib/ignis-lava";

export function SurvivalEffects({viewport,level,zoom,running}:{viewport:RefObject<HTMLDivElement|null>;level:SurvivalLevel;zoom:number;running:boolean}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const surface=canvas.current,region=viewport.current,ctx=surface?.getContext("2d");
    if(!surface||!region||!ctx)return;
    const motion=document.createElement("canvas"),liquid=document.createElement("canvas");
    const fx=motion.getContext("2d"),clip=liquid.getContext("2d");
    if(!fx||!clip)return;
    const advance=level.tileWidth-(level.overlap??0),variants=level.terrains?.length||1;
    const cycleWidth=advance*variants;
    if(!Number.isFinite(cycleWidth)||cycleWidth<=0||!Number.isFinite(level.height)||level.height<=0||!Number.isFinite(zoom)||zoom<=0)return;
    let mask:HTMLCanvasElement|null=null,pools:{x:number;y:number}[]=[],disposed=false;
    let frame=0,last=0,time=0,width=0,height=0,inView=true;

    // Match the renderer's overlapping, mirrored terrain sections first, then
    // classify the COMPOSITED image. A lava/rock join can never use a union mask.
    async function prepareMask(){
      const images=await Promise.all(Array.from({length:variants},(_,index)=>new Promise<HTMLImageElement|null>(resolve=>{
        const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=terrainSection(level,index).source;
      })));
      if(disposed||images.some(image=>!image))return;
      const scale=.5,texture=document.createElement("canvas");
      texture.width=Math.round(cycleWidth*scale);texture.height=Math.round(level.height*scale);
      const textureCtx=texture.getContext("2d",{willReadFrequently:true});if(!textureCtx)return;
      for(let index=-1;index<variants;index++){
        const variant=((index%variants)+variants)%variants,info=terrainSection(level,index);
        const tile=document.createElement("canvas");tile.width=Math.round(level.tileWidth*scale);tile.height=texture.height;
        const tileCtx=tile.getContext("2d");if(!tileCtx)continue;
        if(info.mirrored){tileCtx.translate(tile.width,0);tileCtx.scale(-1,1);}
        tileCtx.drawImage(images[variant]!,0,0,tile.width,tile.height);tileCtx.setTransform(1,0,0,1,0,0);
        if(level.overlap){const fade=tileCtx.createLinearGradient(0,0,level.overlap*scale,0);fade.addColorStop(0,"transparent");fade.addColorStop(1,"black");tileCtx.globalCompositeOperation="destination-in";tileCtx.fillStyle=fade;tileCtx.fillRect(0,0,tile.width,tile.height);}
        textureCtx.drawImage(tile,index*advance*scale,0);
      }
      const pixels=textureCtx.getImageData(0,0,texture.width,texture.height);
      const raw=new Uint8Array(texture.width*texture.height),core=new Uint8Array(raw.length);
      for(let i=0;i<raw.length;i++)raw[i]=isMolten(pixels.data[i*4],pixels.data[i*4+1],pixels.data[i*4+2])?255:0;
      // Erode bright boundaries so interpolation cannot spill onto the rock.
      for(let y=1;y<texture.height-1;y++)for(let x=1;x<texture.width-1;x++){
        const i=y*texture.width+x;core[i]=raw[i]&&raw[i-1]&&raw[i+1]&&raw[i-texture.width]&&raw[i+texture.width]?255:0;
      }
      pools=lavaPools(core,texture.width,texture.height);
      for(let i=0;i<core.length;i++){pixels.data[i*4]=255;pixels.data[i*4+1]=255;pixels.data[i*4+2]=255;pixels.data[i*4+3]=core[i];}
      textureCtx.putImageData(pixels,0,0);mask=texture;draw();
    }
    function draw(){
      // Layout can briefly collapse during navigation or responsive resizing.
      // Async image loads and paused-mode scrolls also enter this function, so
      // validate here rather than relying on the ResizeObserver alone.
      if(disposed||!ctx||!fx||!clip||!region||width<1||height<1||!surface?.width||!surface.height||!motion.width||!motion.height||!liquid.width||!liquid.height)return;
      ctx.clearRect(0,0,width,height);fx.clearRect(0,0,width,height);clip.clearRect(0,0,width,height);
      const period=cycleWidth*zoom,worldHeight=level.height*zoom,pan=region.scrollLeft,panY=region.scrollTop;
      const first=Math.floor(pan/period),end=Math.ceil((pan+width)/period);
      if(mask&&mask.width>0&&mask.height>0){
        for(let cycle=first;cycle<=end;cycle++)clip.drawImage(mask,cycle*period-pan,-panY,period,worldHeight);
        // All convection, glow, boiling and splash rings go into one liquid-only
        // layer. The final destination-in clip also covers the entire bubble.
        const glow=fx.createLinearGradient(0,0,width,height);
        glow.addColorStop(0,"rgba(255,202,77,.07)");glow.addColorStop(.5,`rgba(255,245,156,${.07+Math.sin(time)*.025})`);glow.addColorStop(1,"rgba(255,123,24,.08)");
        fx.fillStyle=glow;fx.fillRect(0,0,width,height);
        for(let i=0;i<18;i++){
          const y=(i*57+time*18)%(height+100)-50;fx.strokeStyle="rgba(255,245,175,.22)";fx.lineWidth=1.4;fx.beginPath();fx.moveTo(-40,y);fx.bezierCurveTo(width*.3,y-26,width*.65,y+34,width+40,y-10);fx.stroke();
        }
        for(let cycle=first;cycle<=end;cycle++){
          for(let i=0;i<Math.min(48,pools.length);i++){
            const pool=pools[(i*37)%pools.length],phase=(time*.26+i*.173)%1;
            const x=(cycle+pool.x)*period-pan,y=pool.y*worldHeight-panY;
            if(x<-25||x>width+25)continue;
            fx.strokeStyle=`rgba(255,249,188,${(1-phase)*.6})`;fx.lineWidth=1.2;fx.beginPath();fx.ellipse(x,y-Math.sin(phase*Math.PI)*2*zoom,(2+phase*10)*zoom,(1+phase*4)*zoom,0,0,Math.PI*2);fx.stroke();
          }
        }
        fx.globalCompositeOperation="destination-in";fx.drawImage(liquid,0,0);fx.globalCompositeOperation="source-over";
        ctx.drawImage(motion,0,0);
      }
      // Rocks, smoke and airborne ash are atmosphere, not liquid surface effects.
      const sectionWidth=advance*zoom,firstSection=Math.floor(pan/sectionWidth),lastSection=Math.ceil((pan+width)/sectionWidth);
      for(let section=firstSection-1;section<=lastSection;section++){
        const base=section*sectionWidth-pan;
        if(running)for(let i=0;i<6;i++){
          const phase=(time*.1+i*.219+section*.13)%1;if(phase>.65)continue;
          const x=base+sectionWidth*(.22+(i%3)*.29)+phase*30*zoom;
          const y=worldHeight*(.3+(i%2)*.25)+(phase*phase*130-phase*20)*zoom-panY;
          ctx.save();ctx.translate(x,y);ctx.rotate(phase*5+i);ctx.fillStyle=i%2?"#62514c":"#84685b";ctx.strokeStyle="#cda18a";ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-4*zoom,-3*zoom);ctx.lineTo(3*zoom,-5*zoom);ctx.lineTo(6*zoom,2*zoom);ctx.lineTo(0,5*zoom);ctx.lineTo(-5*zoom,2*zoom);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
        }
        const terrain=terrainSection(level,section),vents=level.smokeVents?.[terrain.source]??[];
        for(let ventIndex=0;ventIndex<vents.length;ventIndex++){
          const vent=vents[ventIndex],localX=terrain.mirrored?1-vent.x:vent.x;
          const originX=base+localX*level.tileWidth*zoom,originY=vent.y*worldHeight-panY;
          if(originX<-160*zoom||originX>width+160*zoom)continue;
          const seamFade=level.overlap?Math.min(1,localX*level.tileWidth/level.overlap):1;
          // Staggered soft billows rise and curl from the smoke already painted
          // into the terrain. Time is shared with lava, so no extra frame loop.
          for(let puff=0;puff<7;puff++){
            const phase=(time*.1+puff/7+ventIndex*.137+((section%variants)+variants)%variants*.11)%1;
            const curl=Math.sin(phase*6+ventIndex+time*.6)*(8+phase*20);
            const x=originX+(phase*65+curl)*zoom,y=originY-phase*(140+ventIndex%3*24)*zoom;
            const radius=(14+phase*45+Math.sin(time*1.3+puff)*3)*zoom;
            const opacity=Math.sin(phase*Math.PI)**.8*.34*seamFade;
            // Two overlapping lobes roll past each other as the plume expands.
            // The soft edges fade before each puff loops back to the vent.
            for(let lobe=0;lobe<2;lobe++){
              const angle=time*.5+puff*1.7+lobe*Math.PI;
              const cloudX=x+Math.cos(angle)*radius*.28,cloudY=y+Math.sin(angle)*radius*.18;
              const smoke=ctx.createRadialGradient(cloudX,cloudY,0,cloudX,cloudY,radius);
              smoke.addColorStop(0,`rgba(207,200,198,${opacity})`);smoke.addColorStop(.4,`rgba(163,157,162,${opacity*.7})`);smoke.addColorStop(1,"transparent");
              ctx.fillStyle=smoke;ctx.fillRect(cloudX-radius,cloudY-radius,radius*2,radius*2);
            }
          }
        }
      }
      for(let i=0;i<(width<700?22:40);i++){
        const x=((i*137.9+time*11)%(width+30))-15,y=((i*73.7-time*(9+i%7))%height+height)%height;
        ctx.fillStyle=i%3===0?"rgba(255,183,94,.25)":"rgba(232,210,193,.15)";ctx.beginPath();ctx.arc(x,y,.7+i%3*.35,0,Math.PI*2);ctx.fill();
      }
    }
    const resize=()=>{
      if(disposed)return;
      const bounds=region.getBoundingClientRect();
      width=Number.isFinite(bounds.width)?Math.max(0,bounds.width):0;
      height=Number.isFinite(bounds.height)?Math.max(0,bounds.height):0;
      const dpr=Math.min(devicePixelRatio||1,1.5);
      // Keep every drawImage source valid even while its viewport is hidden.
      // Resetting the dimensions clears stale pixels; draw() waits for layout.
      surface.width=Math.max(1,Math.round(width*dpr));surface.height=Math.max(1,Math.round(height*dpr));
      motion.width=liquid.width=Math.max(1,Math.round(width));motion.height=liquid.height=Math.max(1,Math.round(height));
      ctx.setTransform(dpr,0,0,dpr,0,0);draw();
    };
    const animate=(stamp:number)=>{if(disposed)return;if(inView&&!document.hidden&&stamp-last>=33){time+=Math.min((stamp-(last||stamp))/1000,.08);last=stamp;draw();}frame=requestAnimationFrame(animate);};
    const observer=new ResizeObserver(resize);observer.observe(region);const intersection=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;last=0;});intersection.observe(region);
    const scroll=()=>{if(!running)draw();};region.addEventListener("scroll",scroll,{passive:true});
    resize();void prepareMask();if(running)frame=requestAnimationFrame(animate);
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();region.removeEventListener("scroll",scroll);};
  },[viewport,level,zoom,running]);
  return <canvas ref={canvas} className="survival-effects" aria-hidden="true"/>;
}
