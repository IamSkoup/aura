'use client';
import {Canvas} from '@react-three/fiber';
import {ContactShadows,OrbitControls,RoundedBox,useGLTF} from '@react-three/drei';
import {Suspense,useEffect,useMemo,useState} from 'react';
import * as THREE from 'three';
import type {Layer} from '@/lib/types';
import {loadPrivateImage} from '@/lib/asset-client';

const fonts:Record<string,string>={
  'Manrope':'Manrope, Arial, sans-serif','IBM Plex Sans':'IBM Plex Sans, Arial, sans-serif',
  'Arial':'Arial, sans-serif','Georgia':'Georgia, serif','Impact':'Impact, sans-serif',
  'Courier New':'Courier New, monospace','Times New Roman':'Times New Roman, serif',
  'Trebuchet MS':'Trebuchet MS, sans-serif','Verdana':'Verdana, sans-serif','Comic Sans MS':'Comic Sans MS, cursive'
};
function useFabricTexture(){
  return useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(128,128);
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const idx=(y*128+x)*4;
      const grain=((x*37+y*73+x*y*13)%31)-15;
      const weave=(x%4===0?13:0)+(y%4===0?9:0);
      const shade=clampColor(124+grain+weave);
      pixels.data[idx]=pixels.data[idx+1]=pixels.data[idx+2]=shade;pixels.data[idx+3]=255;
    }
    ctx.putImageData(pixels,0,0);
    const tex=new THREE.CanvasTexture(canvas);
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(10,13);
    tex.anisotropy=8;return tex;
  },[]);
}
const clampColor=(v:number)=>Math.max(0,Math.min(255,v));
function usePrintTexture(layers:Layer[],areaId:string,hex:string){
  const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1340;const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.flipY=false;t.anisotropy=8;return t},[]);
  useEffect(()=>{
    let alive=true;const canvas=texture.image as HTMLCanvasElement,ctx=canvas.getContext('2d');if(!ctx)return;
    async function draw(){
      if(!ctx)return;
      ctx.fillStyle=hex;ctx.fillRect(0,0,canvas.width,canvas.height);
      const zone={x:canvas.width*.15,y:canvas.height*.13,w:canvas.width*.70,h:canvas.height*.73};
      for(const layer of layers.filter(l=>l.areaId===areaId)){
        ctx.save();ctx.globalAlpha=layer.opacity;
        const x=zone.x+layer.x*zone.w,y=zone.y+layer.y*zone.h,w=layer.width*zone.w,h=layer.height*zone.h;
        ctx.translate(x+w/2,y+h/2);ctx.rotate(layer.rotation*Math.PI/180);if(layer.flipX)ctx.scale(-1,1);
        if(layer.kind==='image'&&layer.image){
          try{const src=await loadPrivateImage(layer.image.url);const img=new Image();img.src=src;await img.decode();if(!alive){URL.revokeObjectURL(src);ctx.restore();return}ctx.drawImage(img,-w/2,-h/2,w,h);URL.revokeObjectURL(src)}catch{}
        }
        if(layer.kind==='text'){
          ctx.fillStyle=layer.color||'#151515';ctx.textAlign=layer.align||'center';ctx.textBaseline='middle';
          const size=Math.max(14,(layer.fontSize||32)*2);ctx.font=`${layer.italic?'italic ':''}${layer.weight||700} ${size}px ${fonts[layer.font||'Manrope']||'Arial'}`;
          (ctx as CanvasRenderingContext2D&{letterSpacing:string}).letterSpacing=`${layer.letterSpacing||0}px`;
          const lines=(layer.text||'').split('\n').slice(0,10),lineHeight=size*1.1;
          lines.forEach((line,i)=>ctx.fillText(line,layer.align==='left'?-w/2:layer.align==='right'?w/2:0,(i-(lines.length-1)/2)*lineHeight,w*1.12));
        }
        ctx.restore();
      }
      if(alive)texture.needsUpdate=true;
    }
    void draw();return()=>{alive=false};
  },[layers,areaId,hex,texture]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return texture;
}

function Tee({front,back,color}:{front:THREE.Texture;back:THREE.Texture;color:string}){
  const {scene}=useGLTF('/models/aura-tee.glb');
  const fabric=useFabricTexture();
  const copy=useMemo(()=>{const clone=scene.clone(true);clone.traverse(obj=>{if(obj instanceof THREE.Mesh)obj.material=(obj.material as THREE.Material).clone()});return clone},[scene]);
  useEffect(()=>{
    copy.traverse(obj=>{
      if(!(obj instanceof THREE.Mesh))return;
      const mat=obj.material as THREE.MeshStandardMaterial;
      mat.roughness=.93;mat.metalness=0;
      if(obj.name==='Front_Print_Surface'){mat.map=front;mat.color.set('#ffffff')}
      else if(obj.name==='Back_Print_Surface'){mat.map=back;mat.color.set('#ffffff')}
      else {mat.color.set(color);mat.bumpMap=fabric;mat.bumpScale=.017}
      mat.needsUpdate=true;
    });
  },[copy,color,front,back,fabric]);
  return <primitive object={copy} scale={1}/>;
}

function Cloth({kind,front,back,color}:{kind:'hoodie'|'sweatshirt';front:THREE.Texture;back:THREE.Texture;color:string}){
  const fabric=useFabricTexture();
  const shape=useMemo(()=>{
    const s=new THREE.Shape();
    s.moveTo(-.88,-1.23);s.lineTo(-.88,.62);s.lineTo(-1.47,.48);s.lineTo(-1.57,-.52);
    s.lineTo(-1.17,-.57);s.lineTo(-1.06,.04);s.lineTo(-1.02,-1.18);
    s.lineTo(1.02,-1.18);s.lineTo(1.06,.04);s.lineTo(1.17,-.57);s.lineTo(1.57,-.52);
    s.lineTo(1.47,.48);s.lineTo(.88,.62);s.lineTo(.42,1.04);
    s.absarc(0,1.10,.39,0,Math.PI,true);s.lineTo(-.42,1.04);s.lineTo(-.88,.62);
    return s;
  },[]);
  const geo=useMemo(()=>new THREE.ExtrudeGeometry(shape,{depth:.37,steps:1,bevelEnabled:true,bevelThickness:.07,bevelSize:.075,bevelSegments:4,curveSegments:32}),[shape]);
  return <group position={[0,.1,-.19]}>
    <mesh geometry={geo} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.96} bumpMap={fabric} bumpScale={.015} side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,-.12,.265]}><planeGeometry args={[1.65,1.75]}/><meshStandardMaterial map={front} transparent roughness={.93}/></mesh>
    <mesh position={[0,-.12,-.265]} rotation={[0,Math.PI,0]}><planeGeometry args={[1.65,1.75]}/><meshStandardMaterial map={back} transparent roughness={.93}/></mesh>
    <mesh position={[0,-1.16,.19]}><boxGeometry args={[1.82,.10,.43]}/><meshStandardMaterial color={color} roughness={1}/></mesh>
    <mesh position={[0,.94,.2]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.42,.065,9,48,Math.PI]}/><meshStandardMaterial color={color} roughness={1}/></mesh>
    {kind==='hoodie'&&<>
      <mesh position={[0,1.11,-.12]} castShadow><sphereGeometry args={[.55,28,16,0,Math.PI*2,0,Math.PI*.77]}/><meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={1}/></mesh>
      <mesh position={[0,-.62,.29]}><boxGeometry args={[.9,.40,.04]}/><meshStandardMaterial color={color} roughness={1}/></mesh>
    </>}
  </group>;
}
function Mug({texture,color}:{texture:THREE.Texture;color:string}){
  return <group rotation={[0,.3,0]}>
    <mesh castShadow><cylinderGeometry args={[.82,.78,1.62,64,1,false]}/><meshStandardMaterial map={texture} color="#ffffff" roughness={.22} metalness={.04}/></mesh>
    <mesh position={[0,.82,0]}><torusGeometry args={[.77,.07,18,64]}/><meshStandardMaterial color={color} roughness={.25}/></mesh>
    <mesh position={[1.01,.0,0]}><torusGeometry args={[.48,.14,20,64]}/><meshStandardMaterial color={color} roughness={.25}/></mesh>
    <mesh position={[0,-.82,0]}><cylinderGeometry args={[.75,.75,.07,64]}/><meshStandardMaterial color={color} roughness={.28}/></mesh>
  </group>;
}
function FlatProduct({kind,texture,color}:{kind:'case'|'poster';texture:THREE.Texture;color:string}){
  const poster=kind==='poster',width=poster?2.12:1.52,height=poster?2.88:2.86;
  return <group>
    <RoundedBox args={[width,height,poster?.075:.19]} radius={poster?.018:.18} smoothness={6} castShadow><meshStandardMaterial color={color} roughness={poster?.93:.44}/></RoundedBox>
    <mesh position={[0,0,poster?.048:.107]}><planeGeometry args={[width*(poster?.98:.85),height*(poster?.97:.83)]}/><meshStandardMaterial map={texture} roughness={.75}/></mesh>
    {!poster&&<mesh position={[-.43,1.14,.12]}><circleGeometry args={[.13,32]}/><meshStandardMaterial color="#111318" roughness={.18}/></mesh>}
  </group>;
}
function Model({layers,color,side,model}:{layers:Layer[];color:string;side:'front'|'back';model?:string}){
  const front=usePrintTexture(layers,'front',color),back=usePrintTexture(layers,'back',color);
  return <group rotation={[0,side==='back'?Math.PI:0,0]}>
    {model==='hoodie'||model==='sweatshirt'?<Cloth kind={model} front={front} back={back} color={color}/>:
      model==='mug'?<Mug texture={front} color={color}/>:
      model==='case'||model==='poster'?<FlatProduct kind={model} texture={front} color={color}/>:
      <Tee front={front} back={back} color={color}/>}
  </group>;
}
export default function Shirt3D({layers,color,side,autoRotate,model}:{layers:Layer[];color:string;side:'front'|'back';autoRotate:boolean;model?:string}){
  const [webgl,setWebgl]=useState<boolean|null>(null);
  useEffect(()=>{try{setWebgl(!!document.createElement('canvas').getContext('webgl2'))}catch{setWebgl(false)}},[]);
  if(webgl===false)return <div className="fallback-preview"><img src="/images/aura-tee.png" alt="Изделие"/><span>3D недоступно на этом устройстве</span></div>;
  if(webgl===null)return <div className="skeleton stage-skeleton"/>;
  return <Canvas gl={{antialias:true,preserveDrawingBuffer:true}} camera={{position:[0,.06,5.4],fov:37}} shadows dpr={[1,2]}>
    <ambientLight intensity={1.45}/><hemisphereLight args={['#e6f4dc','#5d6157',1]}/>
    <directionalLight position={[3,5,5]} intensity={3.5} castShadow/><directionalLight position={[-4,2,-2]} intensity={1.8}/>
    <Suspense fallback={null}><Model layers={layers} color={color} side={side} model={model}/><ContactShadows position={[0,-1.69,0]} opacity={.3} scale={5} blur={2.6}/></Suspense>
    <OrbitControls enablePan={false} minDistance={3.4} maxDistance={8} autoRotate={autoRotate} autoRotateSpeed={.9} target={[0,0,0]}/>
  </Canvas>;
}
