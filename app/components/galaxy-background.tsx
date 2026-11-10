"use client";

import {useEffect, useRef} from "react";

const vertexShader = `
attribute vec4 a;
uniform float uTime;
uniform float uScroll;
uniform float uAspect;
uniform float uPixelRatio;
varying float vAlpha;
varying vec3 vColor;
void main(){
  vec3 p=a.xyz;
  float seed=a.w;
  float angle=uTime*0.018*(0.35+seed)+p.z*0.025+uScroll*2.4;
  p.xy=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p.xy;
  p.z=mod(p.z+uScroll*42.0,110.0)-110.0;
  float depth=-p.z;
  gl_Position=depth<0.5?vec4(3.0,3.0,3.0,1.0):vec4(p.x*1.45/uAspect,p.y*1.45,0.0,depth);
  gl_PointSize=clamp(uPixelRatio*(1.0+seed*2.0)*8.0/depth,1.0,12.0);
  vAlpha=smoothstep(110.0,18.0,depth)*smoothstep(0.5,3.0,depth);
  vec3 violet=vec3(0.55,0.30,0.92);
  vec3 gold=vec3(0.92,0.72,0.38);
  vec3 blue=vec3(0.32,0.48,0.82);
  vColor=mix(mix(violet,gold,smoothstep(0.0,0.65,uScroll)),blue,smoothstep(0.55,1.0,uScroll));
}
`;

const fragmentShader = `
precision mediump float;
varying float vAlpha;
varying vec3 vColor;
void main(){
  float radius=length(gl_PointCoord-vec2(0.5));
  float glow=1.0-smoothstep(0.12,0.5,radius);
  float alpha=glow*vAlpha*0.72;
  gl_FragColor=vec4(vColor*alpha,alpha);
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

export default function GalaxyBackground(){
  const canvasRef=useRef<HTMLCanvasElement>(null);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas) return;
    const gl=canvas.getContext("webgl",{alpha:true,antialias:false,powerPreference:"low-power"});
    if(!gl) return;

    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile=window.matchMedia("(max-width: 700px)");
    const count=mobile.matches?1800:3600;
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
      const arm=(i%3)*Math.PI*2/3;
      const radius=2+Math.pow(Math.random(),0.62)*34;
      const angle=arm+radius*0.16+(Math.random()-0.5)*0.85;
      data.set([Math.cos(angle)*radius,Math.sin(angle)*radius,-Math.random()*110,Math.random()],i*4);
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
    let frame=0,started=0,scroll=0,visible=!document.hidden,disposed=false;

    const resize=()=>{
      const ratio=Math.min(window.devicePixelRatio||1,1.5);
      const width=Math.max(1,Math.floor(window.innerWidth*ratio));
      const height=Math.max(1,Math.floor(window.innerHeight*ratio));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
      gl.uniform1f(aspectLocation,width/Math.max(1,height));
      gl.uniform1f(pixelLocation,ratio);
    };
    const updateScroll=()=>{
      const max=document.documentElement.scrollHeight-window.innerHeight;
      scroll=max>0?Math.max(0,Math.min(1,window.scrollY/max)):0;
    };
    const draw=(now:number)=>{
      if(disposed||!visible||reduced.matches)return;
      if(!started) started=now;
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(timeLocation,(now-started)/1000);
      gl.uniform1f(scrollLocation,scroll);
      gl.drawArrays(gl.POINTS,0,count);
      frame=window.requestAnimationFrame(draw);
    };
    const start=()=>{if(disposed||!visible||reduced.matches||frame)return;frame=window.requestAnimationFrame(draw);};
    const stop=()=>{if(frame){window.cancelAnimationFrame(frame);frame=0;}};
    const onVisibility=()=>{visible=!document.hidden;if(visible)start();else stop();};
    const onMotion=()=>{if(reduced.matches){stop();gl.clear(gl.COLOR_BUFFER_BIT);}else start();};
    const onContextLost=(event:Event)=>{event.preventDefault();stop();};
    resize();updateScroll();
    window.addEventListener("resize",resize,{passive:true});
    window.addEventListener("scroll",updateScroll,{passive:true});
    document.addEventListener("visibilitychange",onVisibility);
    reduced.addEventListener?.("change",onMotion);
    canvas.addEventListener("webglcontextlost",onContextLost);
    start();
    return ()=>{
      disposed=true;stop();
      window.removeEventListener("resize",resize);
      window.removeEventListener("scroll",updateScroll);
      document.removeEventListener("visibilitychange",onVisibility);
      reduced.removeEventListener?.("change",onMotion);
      canvas.removeEventListener("webglcontextlost",onContextLost);
      gl.deleteBuffer(buffer);gl.deleteProgram(program);
    };
  },[]);

  return <canvas ref={canvasRef} className="galaxy-webgl-background" aria-hidden="true" />;
}
