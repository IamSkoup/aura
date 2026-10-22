'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Brush,Check,Eraser,RotateCcw,Undo2,X} from 'lucide-react';

type Props={areaId:string;onSave:(file:File)=>Promise<void>;onClose:()=>void;busy:boolean};
const W=840,H=1050;
export function PaintTool({areaId,onSave,onClose,busy}:Props){
  const canvas=useRef<HTMLCanvasElement>(null),painting=useRef(false),last=useRef<{x:number;y:number}|null>(null),history=useRef<{pixels:ImageData;dirty:boolean}[]>([]);
  const [color,setColor]=useState('#c9ff48'),[size,setSize]=useState(12),[eraser,setEraser]=useState(false),[dirty,setDirty]=useState(false),[undoCount,setUndoCount]=useState(0);
  useEffect(()=>{history.current=[];setDirty(false);setUndoCount(0);canvas.current?.getContext('2d')?.clearRect(0,0,W,H)},[areaId]);
  const saveHistory=()=>{const ctx=canvas.current?.getContext('2d');if(ctx){history.current.push({pixels:ctx.getImageData(0,0,W,H),dirty});if(history.current.length>14)history.current.shift();setUndoCount(history.current.length)}};
  const position=(e:React.PointerEvent<HTMLCanvasElement>)=>{const rect=e.currentTarget.getBoundingClientRect();return {x:(e.clientX-rect.left)/rect.width*W,y:(e.clientY-rect.top)/rect.height*H}};
  const stroke=(from:{x:number;y:number},to:{x:number;y:number})=>{const ctx=canvas.current?.getContext('2d');if(!ctx)return;ctx.save();ctx.globalCompositeOperation=eraser?'destination-out':'source-over';ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=size*2;ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();ctx.restore()};
  const down=(e:React.PointerEvent<HTMLCanvasElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);saveHistory();painting.current=true;const p=position(e);stroke(p,{x:p.x+.01,y:p.y+.01});last.current=p;setDirty(true)};
  const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!painting.current||!last.current)return;const p=position(e);stroke(last.current,p);last.current=p};
  const stop=()=>{painting.current=false;last.current=null};
  const undo=()=>{const ctx=canvas.current?.getContext('2d'),prev=history.current.pop();if(ctx&&prev){ctx.putImageData(prev.pixels,0,0);setDirty(prev.dirty);setUndoCount(history.current.length)}};
  const clear=()=>{saveHistory();canvas.current?.getContext('2d')?.clearRect(0,0,W,H);setDirty(false)};
  const save=async()=>{if(!canvas.current||!dirty)return;const blob=await new Promise<Blob|null>(resolve=>canvas.current!.toBlob(resolve,'image/png'));if(blob)await onSave(new File([blob],`aura-drawing-${Date.now()}.png`,{type:'image/png'}))};
  const target=typeof document==='undefined'?null:document.querySelector('.aw-print-zone');
  return <>
    {target&&createPortal(<canvas ref={canvas} className={'paint-layer'+(eraser?' eraser':'')} width={W} height={H} onPointerDown={down} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} aria-label="Рисование на области печати"/>,target)}
    <div className="brush-toolbar">
      <button className={!eraser?'active':''} onClick={()=>setEraser(false)}><Brush size={15}/> Кисть</button>
      <button className={eraser?'active':''} onClick={()=>setEraser(true)}><Eraser size={15}/> Ластик</button>
      <input aria-label="Цвет кисти" type="color" value={color} onChange={e=>setColor(e.target.value)}/>
      <label>Толщина: {size}<input aria-label="Толщина кисти" type="range" min="2" max="50" value={size} onChange={e=>setSize(+e.target.value)}/></label>
    </div>
    <div className="paint-actions">
      <button disabled={!undoCount} onClick={undo}><Undo2 size={14}/> Назад</button><button disabled={!dirty} onClick={clear}><RotateCcw size={14}/> Очистить</button>
      <button className="button button-lime" disabled={!dirty||busy} onClick={()=>void save()}><Check size={14}/> Добавить рисунок</button>
      <button onClick={onClose}><X size={14}/> Закрыть кисть</button>
    </div>
    <p className="paint-tip">Рисуй прямо поверх области печати мышью, стилусом или пальцем. После добавления рисунок станет отдельным слоем.</p>
  </>;
}
