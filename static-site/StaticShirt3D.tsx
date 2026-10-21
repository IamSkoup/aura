import {Canvas} from '@react-three/fiber';
import {ContactShadows, OrbitControls, useGLTF} from '@react-three/drei';
import {Suspense, useEffect, useMemo, useState} from 'react';
import * as THREE from 'three';
import type {Layer} from '@/lib/types';
import {assetUrl} from './catalog';

function usePrintTexture(layers: Layer[], areaId: string, hex: string) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1340;
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.flipY = false;
    return result;
  }, []);

  useEffect(() => {
    let active = true;
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    async function draw() {
      if (!ctx) return;
      ctx.fillStyle = hex;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const zone = {x: canvas.width * .18, y: canvas.height * .19, w: canvas.width * .64, h: canvas.height * .63};
      for (const layer of layers.filter(l => l.areaId === areaId)) {
        if (!active) break;
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        const x = zone.x + layer.x * zone.w, y = zone.y + layer.y * zone.h;
        const w = layer.width * zone.w, h = layer.height * zone.h;
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate(layer.rotation * Math.PI / 180);
        ctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
        if (layer.kind === 'image' && layer.image?.url) {
          try {
            const img = new Image();
            img.src = layer.image.url;
            await img.decode();
            if (active) ctx.drawImage(img, -w / 2, -h / 2, w, h);
          } catch { /* Deleted local asset; keep editing the rest. */ }
        }
        if (layer.kind === 'text') {
          ctx.fillStyle = layer.color || '#151515';
          ctx.textAlign = layer.align || 'center';
          ctx.textBaseline = 'middle';
          const fontSize = Math.max(16, (layer.fontSize || 30) * 2);
          const font = layer.font || 'Manrope';
          try {await document.fonts.load(`${layer.weight || 600} ${fontSize}px \"${font}\"`);} catch {}
          ctx.font = `${layer.italic ? 'italic ' : ''}${layer.weight || 600} ${fontSize}px \"${font}\"`;
          ctx.letterSpacing = `${layer.letterSpacing || 0}px`;
          const lines = (layer.text || '').split('\n').slice(0, 10);
          lines.forEach((line, i) => ctx.fillText(line, layer.align === 'left' ? -w / 2 : layer.align === 'right' ? w / 2 : 0, (i - (lines.length - 1) / 2) * fontSize * 1.15, w));
        }
        ctx.restore();
      }
      if (active) texture.needsUpdate = true;
    }
    void draw();
    return () => {active = false;};
  }, [layers, areaId, hex, texture]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Model({layers, color, side}: {layers: Layer[]; color: string; side: 'front'|'back'}) {
  const {scene} = useGLTF(assetUrl('models/aura-tee.glb'));
  const copy = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse(object => {if (object instanceof THREE.Mesh) object.material = (object.material as THREE.Material).clone();});
    return cloned;
  }, [scene]);
  const front = usePrintTexture(layers, 'front', color);
  const back = usePrintTexture(layers, 'back', color);
  useEffect(() => {
    copy.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = object.material as THREE.MeshStandardMaterial;
      if (object.name === 'Front_Print_Surface' || object.name === 'Back_Print_Surface') {
        material.map = object.name === 'Front_Print_Surface' ? front : back;
        material.color.set('#ffffff');
      } else material.color.set(color);
      material.needsUpdate = true;
    });
  }, [copy, color, front, back]);
  useEffect(() => () => copy.traverse(object => {if (object instanceof THREE.Mesh) (object.material as THREE.Material).dispose();}), [copy]);
  return <primitive object={copy} rotation={[0, side === 'back' ? Math.PI : 0, 0]} />;
}

export default function StaticShirt3D({layers, color, side, autoRotate}: {layers: Layer[]; color: string; side: 'front'|'back'; autoRotate: boolean}) {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  useEffect(() => {
    try {setWebgl(!!document.createElement('canvas').getContext('webgl2'));}
    catch {setWebgl(false);}
  }, []);
  if (webgl === false) return <div className="aw-fallback"><img src={assetUrl('images/tee-editorial.webp')} alt="Футболка Aura Wear"/><p>WebGL недоступен. Используйте 2D-редактор ниже.</p></div>;
  if (webgl === null) return <div className="aw-stage-loading" role="status">Загружаем 3D-модель…</div>;
  return <Canvas gl={{antialias: true, preserveDrawingBuffer: true}} camera={{position: [0, .08, 5.2], fov: 38}} shadows dpr={[1, 2]}>
    <color attach="background" args={['#deded9']}/>
    <ambientLight intensity={.95}/>
    <directionalLight position={[3, 4, 5]} intensity={2.8} castShadow/>
    <directionalLight position={[-3, 1, -4]} intensity={1.2}/>
    <Suspense fallback={null}><Model layers={layers} color={color} side={side}/><ContactShadows position={[0, -1.75, 0]} opacity={.25} scale={4} blur={2.5}/></Suspense>
    <OrbitControls enablePan={false} minDistance={3.2} maxDistance={8} autoRotate={autoRotate} autoRotateSpeed={1.2}/>
  </Canvas>;
}
