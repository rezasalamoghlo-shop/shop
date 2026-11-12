"use client";

import {useEffect,useRef} from "react";

const vertexShader = `
attribute vec4 a;
uniform float uTime;
uniform float uScroll;
uniform float uAspect;
uniform float uPixelRatio;
varying float vAlpha;
varying vec3 vColor;
varying float vCore;
void main(){
  vec3 p=a.xyz;
  float seed=a.w;
  float radius=length(p.xy);
  float angle=uTime*0.012*(0.3+seed*0.7)+uScroll*0.42;
  float c=cos(angle),s=sin(angle);
  p.xy=mat2(c,-s,s,c)*p.xy;

  // A gently inclined, thick galactic disk gives the spiral real spatial depth.
  float diskY=p.y*0.64+p.z*0.10;
  float depth=82.0-p.z*0.42+radius*0.12;
  float perspective=82.0/max(18.0,depth);
  float x=p.x*perspective;
  float y=diskY*perspective;

  gl_Position=vec4(x*1.52/uAspect,y*1.52,0.0,1.0);
  float radialFade=1.0-smoothstep(25.0,38.0,radius);
  float pointBase=mix(1.15,3.7,seed);
  gl_PointSize=clamp(uPixelRatio*pointBase*perspective,1.0,7.0);

  float core=smoothstep(13.0,0.0,radius);
  vCore=core;
  vAlpha=(0.20+seed*0.58)*radialFade*smoothstep(0.0,5.0,depth);
  vec3 violet=vec3(0.55,0.29,0.92);
  vec3 magenta=vec3(0.86,0.35,0.84);
  vec3 ice=vec3(0.72,0.78,1.0);
  vec3 gold=vec3(0.96,0.76,0.43);
  vec3 armColor=mix(violet,magenta,smoothstep(0.25,0.85,seed));
  armColor=mix(armColor,ice,smoothstep(0.91,0.995,seed)*0.62);
  vColor=mix(armColor,gold,core*0.42);
}
`;

const fragmentShader = `
precision mediump float;
varying float vAlpha;
varying vec3 vColor;
varying float vCore;
void main(){
  float radius=length(gl_PointCoord-vec2(0.5));
  float soft=1.0-smoothstep(0.08,0.5,radius);
  float hot=1.0-smoothstep(0.0,0.22,radius);
  float alpha=soft*vAlpha*(0.62+hot*0.38);
  gl_FragColor=vec4(vColor*(0.72+hot*0.8+vCore*0.18),alpha);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader=gl.createShader(type);
  if(!shader) return null;
  gl.shaderSource(shader,source);
  gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null;}
  return shader;
}

function randomBetween(min:number,max:number){return min+Math.random()*(max-min)}

export default function GalaxyBackground(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const sceneRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas) return;
    const mobile=window.matchMedia("(max-width: 700px)").matches;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    const lowPower=(navigator.hardwareConcurrency||8)<=4 || (navigator as Navigator & {connection?:{saveData?:boolean}}).connection?.saveData===true;
    // CSS provides a layered, lightweight depth treatment on mobile and low-power devices.
    if(mobile||reduced.matches||lowPower){
      canvas.dataset.renderMode="static";
      if(lowPower&&!mobile&&!reduced.matches){canvas.parentElement?.classList.add("galaxy-static-scene");return()=>canvas.parentElement?.classList.remove("galaxy-static-scene");}
      return;
    }
    const gl=canvas.getContext("webgl",{alpha:true,antialias:false,powerPreference:"low-power",premultipliedAlpha:true});
    if(!gl) return;

    const count=6200;
    const vertex=compileShader(gl,gl.VERTEX_SHADER,vertexShader);
    const fragment=compileShader(gl,gl.FRAGMENT_SHADER,fragmentShader);
    if(!vertex||!fragment) return;
    const program=gl.createProgram();
    if(!program) return;
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    gl.deleteShader(vertex);gl.deleteShader(fragment);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);return;}
    gl.useProgram(program);

    const data=new Float32Array(count*4);
    for(let i=0;i<count;i++){
      const seed=Math.random();
      const armCount=4;
      const arm=(i%armCount)*Math.PI*2/armCount;
      const radius=Math.pow(Math.random(),0.72)*35;
      const spiral=arm+radius*0.235+randomBetween(-0.26,0.26)*(0.35+radius/35);
      const spread=randomBetween(-0.95,0.95)*(0.45+radius*0.045);
      const x=Math.cos(spiral)*radius+Math.cos(spiral+Math.PI/2)*spread;
      const y=Math.sin(spiral)*radius+Math.sin(spiral+Math.PI/2)*spread;
      const thickness=randomBetween(-2.8,2.8)*(0.35+radius/35);
      data.set([x,y,thickness,seed],i*4);
    }
    const buffer=gl.createBuffer();
    if(!buffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    const attribute=gl.getAttribLocation(program,"a");
    gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,4,gl.FLOAT,false,0,0);
    const timeLocation=gl.getUniformLocation(program,"uTime");
    const scrollLocation=gl.getUniformLocation(program,"uScroll");
    const aspectLocation=gl.getUniformLocation(program,"uAspect");
    const pixelLocation=gl.getUniformLocation(program,"uPixelRatio");
    let frame=0,started=0,lastFrame=0,scroll=0,visible=!document.hidden,disposed=false,inViewport=true;
    const frameInterval=1000/30;

    const resize=()=>{
      const ratio=Math.min(window.devicePixelRatio||1,1.25);
      const width=Math.max(1,Math.floor(window.innerWidth*ratio));
      const height=Math.max(1,Math.floor(window.innerHeight*ratio));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
      gl.uniform1f(aspectLocation,width/Math.max(1,height));
      gl.uniform1f(pixelLocation,ratio);
    };
    const updateScroll=()=>{
      const max=document.documentElement.scrollHeight-window.innerHeight;
      scroll=max>0?Math.max(0,Math.min(1,window.scrollY/max)):0;
      sceneRef.current?.style.setProperty("--galaxy-scroll",String(scroll));
    };
    const onPointerMove=(event:PointerEvent)=>{
      if(event.pointerType!=="mouse"||!sceneRef.current)return;
      const x=(event.clientX/window.innerWidth-.5)*2;
      const y=(event.clientY/window.innerHeight-.5)*2;
      sceneRef.current.style.setProperty("--galaxy-pointer-x",String(x));
      sceneRef.current.style.setProperty("--galaxy-pointer-y",String(y));
    };
    const resetPointer=()=>{
      sceneRef.current?.style.setProperty("--galaxy-pointer-x","0");
      sceneRef.current?.style.setProperty("--galaxy-pointer-y","0");
    };
    const draw=(now:number)=>{
      frame=0;
      if(disposed||!visible||!inViewport||reduced.matches)return;
      if(now-lastFrame<frameInterval){frame=window.requestAnimationFrame(draw);return;}
      lastFrame=now;
      if(!started) started=now;
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(timeLocation,(now-started)/1000);
      gl.uniform1f(scrollLocation,scroll);
      gl.drawArrays(gl.POINTS,0,count);
      frame=window.requestAnimationFrame(draw);
    };
    const start=()=>{if(disposed||!visible||!inViewport||reduced.matches||frame)return;frame=window.requestAnimationFrame(draw);};
    const stop=()=>{if(frame){window.cancelAnimationFrame(frame);frame=0;}};
    const onVisibility=()=>{visible=!document.hidden;if(visible)start();else stop();};
    const observer=new IntersectionObserver(entries=>{inViewport=Boolean(entries[0]?.isIntersecting);if(inViewport)start();else stop();},{threshold:0.01});
    observer.observe(canvas);
    const onMotion=()=>{if(reduced.matches){stop();gl.clear(gl.COLOR_BUFFER_BIT);}else start();};
    const onContextLost=(event:Event)=>{event.preventDefault();stop();};
    resize();updateScroll();
    window.addEventListener("resize",resize,{passive:true});
    window.addEventListener("scroll",updateScroll,{passive:true});
    window.addEventListener("pointermove",onPointerMove,{passive:true});
    window.addEventListener("blur",resetPointer);
    document.addEventListener("visibilitychange",onVisibility);
    reduced.addEventListener?.("change",onMotion);
    canvas.addEventListener("webglcontextlost",onContextLost);
    start();
    return ()=>{
      disposed=true;stop();
      window.removeEventListener("resize",resize);
      window.removeEventListener("scroll",updateScroll);
      window.removeEventListener("pointermove",onPointerMove);
      window.removeEventListener("blur",resetPointer);
      document.removeEventListener("visibilitychange",onVisibility);
      reduced.removeEventListener?.("change",onMotion);
      canvas.removeEventListener("webglcontextlost",onContextLost);
      observer.disconnect();
      gl.deleteBuffer(buffer);gl.deleteProgram(program);
    };
  },[]);

  return <><div ref={sceneRef} className="galaxy-cinematic-scene" aria-hidden="true"><div className="galaxy-nebula galaxy-nebula-one"/><div className="galaxy-nebula galaxy-nebula-two"/><div className="galaxy-lens-glow"/><div className="galaxy-orbit galaxy-orbit-one"/><div className="galaxy-orbit galaxy-orbit-two"/><div className="galaxy-star-layer">{Array.from({length:34},(_,i)=><i key={i} style={{left:`${(i*97+13)%100}%`,top:`${(i*53+7)%100}%`,animationDelay:`${i*-.31}s`,animationDuration:`${2.8+(i%5)*.7}s`}/>)}</div><div className="galaxy-gold-drift">{Array.from({length:16},(_,i)=><i key={i} style={{left:`${(i*137+9)%100}%`,top:`${(i*71+14)%100}%`,animationDelay:`${i*-.9}s`,animationDuration:`${11+(i%4)*3}s`}/>)}</div></div><canvas ref={canvasRef} className="galaxy-webgl-background" aria-hidden="true"/></>;
}
