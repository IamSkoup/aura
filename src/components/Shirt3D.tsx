'use client';
import {Canvas} from '@react-three/fiber';
import {OrbitControls,useGLTF,ContactShadows} from '@react-three/drei';
import {Suspense,useEffect,useMemo,useState} from 'react';
import * as THREE from 'three';
import type {Layer} from '@/lib/types';
import {loadPrivateImage} from '@/lib/asset-client';
function usePrintTexture(layers:Layer[],areaId:string,hex:string){const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1340;const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.flipY=false;return t},[]);
 useEffect(()=>{let alive=true;const canvas=texture.image as HTMLCanvasElement;const ctx=canvas.getContext('2d');if(!ctx)return;
 async function render(){if(!ctx)return;ctx.fillStyle=hex;ctx.fillRect(0,0,canvas.width,canvas.height);
  const zone={x:canvas.width*.18,y:canvas.height*.19,w:canvas.width*.64,h:canvas.height*.63};
  for(const layer of layers.filter(l=>l.areaId===areaId)){
   ctx.save();ctx.globalAlpha=layer.opacity;const x=zone.x+layer.x*zone.w,y=zone.y+layer.y*zone.h,w=layer.width*zone.w,h=layer.height*zone.h;
   ctx.translate(x+w/2,y+h/2);ctx.rotate(layer.rotation*Math.PI/180);
   if(layer.kind==='image'&&layer.image){try{const src=await loadPrivateImage(layer.image.url);const img=new Image();img.src=src;await img.decode();if(!alive){URL.revokeObjectURL(src);ctx.restore();return}ctx.drawImage(img,-w/2,-h/2,w,h);URL.revokeObjectURL(src)}catch{}}
   if(layer.kind==='text'){ctx.fillStyle=layer.color||'#151515';ctx.textAlign=layer.align||'center';ctx.font=`${layer.italic?'italic ':''}${layer.weight||600} ${Math.max(16,(layer.fontSize||30)*2)}px ${layer.font==='IBM Plex Sans'?'IBM Plex Sans':'Manrope'}`;const lines=(layer.text||'').split('\n').slice(0,10);const lineHeight=Math.max(16,(layer.fontSize||30)*2)*1.15;lines.forEach((line,i)=>ctx.fillText(line,layer.align==='left'?-w/2:layer.align==='right'?w/2:0,(i-(lines.length-1)/2)*lineHeight,w))}
   ctx.restore();
  }
  if(alive)texture.needsUpdate=true;
 }
 void render();return()=>{alive=false};
 },[layers,areaId,hex,texture]);return texture}
function Model({layers,color,side}:{layers:Layer[];color:string;side:'front'|'back'}){const {scene}=useGLTF('/models/aura-tee.glb');const copy=useMemo(()=>{const cloned=scene.clone(true);cloned.traverse(obj=>{if(obj instanceof THREE.Mesh)obj.material=(obj.material as THREE.Material).clone()});return cloned},[scene]);const front=usePrintTexture(layers,'front',color),back=usePrintTexture(layers,'back',color);
 useEffect(()=>{copy.traverse(obj=>{if(!(obj instanceof THREE.Mesh))return;const m=obj.material as THREE.MeshStandardMaterial;if(obj.name==='Front_Print_Surface'){m.map=front;m.color.set('#ffffff')}else if(obj.name==='Back_Print_Surface'){m.map=back;m.color.set('#ffffff')}else m.color.set(color);m.needsUpdate=true})},[copy,color,front,back]);
 return <primitive object={copy} rotation={[0,side==='back'?Math.PI:0,0]} scale={1}/>}
export default function Shirt3D({layers,color,side,autoRotate}:{layers:Layer[];color:string;side:'front'|'back';autoRotate:boolean}){const [webgl,setWebgl]=useState<boolean|null>(null);useEffect(()=>{try{setWebgl(!!document.createElement('canvas').getContext('webgl2'))}catch{setWebgl(false)}},[]);if(webgl===false)return <div className="fallback-preview"><img src="/images/aura-tee.png" alt="2D вид футболки"/><span>2D-предпросмотр: WebGL недоступен</span></div>;if(webgl===null)return <div className="skeleton stage-skeleton"/>;return <Canvas gl={{antialias:true,preserveDrawingBuffer:true}} camera={{position:[0,.08,5.2],fov:38}} shadows dpr={[1,2]}><color attach="background" args={['#deded9']}/><ambientLight intensity={1.2}/><directionalLight position={[3,4,5]} intensity={2.5} castShadow/><directionalLight position={[-3,1,-4]} intensity={1.2}/><Suspense fallback={null}><Model layers={layers} color={color} side={side}/><ContactShadows position={[0,-1.75,0]} opacity={.25} scale={4} blur={2.5}/></Suspense><OrbitControls enablePan={false} minDistance={3.2} maxDistance={8} autoRotate={autoRotate} autoRotateSpeed={1.2}/></Canvas>}
