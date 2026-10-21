'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowUp,Copy,Download,ImagePlus,Paintbrush,RotateCcw,Save,ShoppingBag,Trash2,Type,Undo2,Redo2} from 'lucide-react';
import {useRouter} from 'next/navigation';
import type {Layer,Product,Design,DesignTemplate} from '@/lib/types';
import {money} from '@/lib/types';
import {starterPrints} from '@/lib/catalog-data';
import {useDesign} from '@/store/design';
import {useCart} from '@/store/cart';
import {useAuth} from './AuthProvider';
import {PaintTool} from './PaintTool';
import {api,auth} from '@/lib/firebase-client';
import {loadPrivateImage} from '@/lib/asset-client';
import {validLayerBounds} from '@/lib/validation';
import dynamic from 'next/dynamic';
const Shirt3D=dynamic(()=>import('./Shirt3D'),{ssr:false,loading:()=><div className="skeleton stage-skeleton"/>});
const fonts=['Manrope','IBM Plex Sans','Arial','Impact','Georgia','Times New Roman','Trebuchet MS','Verdana','Courier New','Comic Sans MS'];
const inkColors=['#111111','#ffffff','#c9ff48','#ff4757','#ffb547','#70c4ff','#b384ff','#37b887','#ff85be','#747474'];
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const uid=()=>crypto.randomUUID();
function ProtectedLayerImage({layer}:{layer:Layer}){
  const [src,setSrc]=useState('');
  useEffect(()=>{let url='',active=true;if(layer.image)loadPrivateImage(layer.image.url).then(v=>{url=v;if(active)setSrc(v)}).catch(()=>{});return()=>{active=false;if(url)URL.revokeObjectURL(url)}},[layer.image]);
  return src?<img src={src} alt={layer.image?.name||'Загруженный принт'} draggable={false}/>:<span className="skeleton"/>;
}
type Props={product:Product;designId?:string;templateId?:string;starterPrint?:string};
export function DesignEditor({product,designId,templateId,starterPrint}:Props){
  const d=useDesign(),{user}=useAuth(),router=useRouter(),cart=useCart();
  const [active,setActive]=useState('front'),[selected,setSelected]=useState<string|null>(null);
  const [side,setSide]=useState<'front'|'back'>('front'),[autoRotate,setAutoRotate]=useState(false);
  const [busy,setBusy]=useState(false),[paint,setPaint]=useState(false),[message,setMessage]=useState('');
  const [templateExtra,setTemplateExtra]=useState(0),[resetCamera,setResetCamera]=useState(0);
  const applied=useRef(''),file=useRef<HTMLInputElement>(null),zone=useRef<HTMLDivElement>(null),stage=useRef<HTMLDivElement>(null);
  const drag=useRef<{id:string;startX:number;startY:number;layerX:number;layerY:number}|null>(null);

  useEffect(()=>{
    const state=useDesign.getState();
    if(designId&&user)api<{design:Design}>(`/api/designs/${designId}`).then(r=>{useDesign.getState().load(r.design);setActive(r.design.layers[0]?.areaId||'front')}).catch(e=>setMessage((e as Error).message));
    else if(!state.productId||state.productId!==product.id)state.setProduct(product.id,product.colors[0].name,product.sizes[0]);
  },[designId,user,product.id,product.colors,product.sizes]);
  useEffect(()=>{
    if(!starterPrint||designId||applied.current===starterPrint)return;
    const print=starterPrints.find(p=>p.id===starterPrint);if(!print)return;
    applied.current=starterPrint;
    const id=uid();useDesign.getState().addLayer({id,kind:'text',areaId:'front',x:.08,y:.39,width:.84,height:.18,rotation:print.id==='punch'?-7:0,opacity:1,text:print.title,font:['minimal','holiday'].includes(print.id)?'Georgia':'Impact',color:print.id==='holiday'?'#ffffff':'#c9ff48',fontSize:print.title.length>12?28:44,weight:700,align:'center'});
    setSelected(id);setMessage('Принт добавлен — можешь менять текст, цвет и шрифт');
  },[starterPrint,designId]);
  useEffect(()=>{
    if(!templateId||!user||designId||applied.current===templateId)return;
    applied.current=templateId;
    api<{asset:NonNullable<Layer['image']>;template:DesignTemplate}>(`/api/templates/${templateId}/adopt`,{method:'POST',body:'{}'}).then(({asset,template})=>{
      useDesign.getState().setTemplateId(template.id);
      useDesign.getState().addLayer({id:uid(),kind:'image',areaId:'front',x:.2,y:.2,width:.6,height:Math.min(.6,.6*asset.height/asset.width),rotation:0,opacity:1,image:asset});
      setTemplateExtra(template.extraPriceRub);setMessage('Принт добавлен');
    }).catch(e=>setMessage((e as Error).message));
  },[templateId,user,designId]);
  useEffect(()=>{if(d.templateId)api<{items:DesignTemplate[]}>('/api/templates').then(r=>setTemplateExtra(r.items.find(t=>t.id===d.templateId)?.extraPriceRub||0)).catch(()=>{})},[d.templateId]);

  const selectedLayer=d.layers.find(l=>l.id===selected);
  const color=/^#[0-9a-fA-F]{6}$/.test(d.color)?d.color:product.colors.find(c=>c.name===d.color)?.hex||product.colors[0].hex;
  const usedAreas=new Set(d.layers.map(l=>l.areaId));
  const price=product.priceRub+templateExtra+[...usedAreas].reduce((sum,id)=>sum+(product.printAreas.find(a=>a.id===id)?.extraPriceRub||0),0);
  const outsideLayers=d.layers.filter(l=>!validLayerBounds(l));
  const area=product.printAreas.find(a=>a.id===active)||product.printAreas[0];
  const update=(patch:Partial<Layer>)=>{if(selectedLayer)d.updateLayer(selectedLayer.id,patch)};

  const save=async()=>{
    if(outsideLayers.length){setMessage('Проверь расположение слоёв: часть принта выходит за границы печати');return null}
    if(!user){router.push(`/login?next=${encodeURIComponent('/studio?product='+product.id)}`);return null}
    setBusy(true);setMessage('');
    try{
      const r=await api<{design:Design}>('/api/designs',{method:'POST',body:JSON.stringify({id:d.id,productId:product.id,templateId:d.templateId,color:d.color,size:d.size,layers:d.layers,title:d.title,isPublic:d.isPublic})});
      d.setId(r.design.id);setMessage('Проект сохранён');return r.design.id;
    }catch(e){setMessage((e as Error).message);return null}finally{setBusy(false)}
  };
  const upload=async(f:File,painting=false)=>{
    if(!user){setMessage('Войди в аккаунт, чтобы добавить изображение или рисунок');return}
    if(f.size>8*1024*1024){setMessage('Файл больше 8 МБ');return}
    setBusy(true);setMessage('');
    try{
      const body=new FormData();body.append('file',f);
      const token=await auth.currentUser?.getIdToken();
      const res=await fetch('/api/assets',{method:'POST',headers:{Authorization:`Bearer ${token}`},body});
      const data=await res.json();if(!res.ok)throw new Error(data.error);
      const ratio=data.asset.height/data.asset.width,width=painting?.82:.42;
      const layer:Layer={id:uid(),kind:'image',areaId:active,x:painting?.09:.29,y:painting?.09:.27,width,height:Math.min(painting?.82:.7,width*ratio),rotation:0,opacity:1,image:data.asset};
      d.addLayer(layer);setSelected(layer.id);setPaint(false);setMessage('Изображение добавлено в макет');
    }catch(e){setMessage((e as Error).message)}finally{setBusy(false)}
  };
  const addText=()=>{
    const id=uid();d.addLayer({id,kind:'text',areaId:active,x:.18,y:.4,width:.64,height:.14,rotation:0,opacity:1,text:'ТВОЙ ТЕКСТ',font:'Manrope',color:'#151515',fontSize:32,letterSpacing:0,weight:700,align:'center'});setSelected(id);setPaint(false);
  };
  const onPointerMove=(e:React.PointerEvent)=>{
    if(!drag.current||!zone.current)return;
    const box=zone.current.getBoundingClientRect(),l=d.layers.find(l=>l.id===drag.current?.id);if(!l)return;
    d.updateLayer(l.id,{x:clamp(drag.current.layerX+(e.clientX-drag.current.startX)/box.width,0,1-l.width),y:clamp(drag.current.layerY+(e.clientY-drag.current.startY)/box.height,0,1-l.height)},false);
  };
  const downloadPreview=()=>{
    const canvas=stage.current?.querySelector('canvas');if(!canvas){setMessage('3D-предпросмотр недоступен');return}
    const link=document.createElement('a');link.href=canvas.toDataURL('image/png');link.download='aura-preview.png';link.click();
  };
  const addToCart=async()=>{const id=await save();if(id){cart.add({designId:id,productId:product.id,quantity:1});router.push('/cart')}};
  return <div className="studio-layout">
    <div className="studio-main">
      <div className="stage" ref={stage}>
        <div className="stage-top"><span>3D-ПРОСМОТР <span className="live-dot"/> В РЕАЛЬНОМ ВРЕМЕНИ</span><span>ПОВОРАЧИВАЙ МЫШЬЮ · ПРИБЛИЖАЙ КОЛЕСОМ</span></div>
        <Shirt3D key={resetCamera} layers={d.layers} color={color} side={side} autoRotate={autoRotate} model={product.model||({'Худи':'hoodie','Свитшоты':'sweatshirt','Кружки':'mug','Чехлы':'case','Постеры':'poster'} as Record<string,string>)[product.category]}/>
        <div className="stage-controls">
          <button onClick={downloadPreview} aria-label="Скачать изображение"><Download size={15}/></button>
          <button onClick={()=>setSide('front')} className={side==='front'?'active':''}>Спереди</button>
          {product.printAreas.some(a=>a.id==='back')&&<button onClick={()=>setSide('back')} className={side==='back'?'active':''}>Сзади</button>}
          <button onClick={()=>setAutoRotate(!autoRotate)} className={autoRotate?'active':''}>Вращение</button>
          <button onClick={()=>setResetCamera(v=>v+1)} aria-label="Сбросить камеру"><RotateCcw size={15}/></button>
        </div>
      </div>
      <div className="editor-panel"><div className="editor-head"><div><span className="eyebrow">РАБОЧАЯ ОБЛАСТЬ</span><h2>{area.label}</h2></div><span>{area.widthMm} × {area.heightMm} мм</span></div>
        <p className="editor-hint">Перетащи слой мышью или используй стрелки клавиатуры. Изменения сразу появятся на 3D-модели.</p>
        <div className="print-board"><div className="print-zone" ref={zone} onPointerMove={onPointerMove} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} style={{background:color}}>
          {d.layers.filter(l=>l.areaId===active).map(l=><div key={l.id} role="button" tabIndex={0} aria-label={l.kind==='image'?`Изображение ${l.image?.name}`:`Текст ${l.text}`}
            onKeyDown={e=>{if(e.key.startsWith('Arrow')){e.preventDefault();const step=e.shiftKey?.05:.01;d.updateLayer(l.id,{x:clamp(l.x+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0),0,1-l.width),y:clamp(l.y+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0),0,1-l.height)});setSelected(l.id)}}}
            className={'print-layer'+(selected===l.id?' selected':'')}
            style={{left:`${l.x*100}%`,top:`${l.y*100}%`,width:`${l.width*100}%`,height:`${l.height*100}%`,transform:`rotate(${l.rotation}deg) ${l.flipX?'scaleX(-1)':''}`,opacity:l.opacity,touchAction:'none'}}
            onPointerDown={e=>{if(paint)return;e.currentTarget.setPointerCapture(e.pointerId);d.checkpoint();setSelected(l.id);drag.current={id:l.id,startX:e.clientX,startY:e.clientY,layerX:l.x,layerY:l.y}}}>
            {l.kind==='image'?<ProtectedLayerImage layer={l}/>:<span style={{fontFamily:l.font||'Manrope',color:l.color,fontWeight:l.weight,fontSize:`${Math.max(12,(l.fontSize||30)*.48)}px`,fontStyle:l.italic?'italic':'normal',textAlign:l.align||'center',letterSpacing:l.letterSpacing||0,whiteSpace:'pre-wrap'}}>{l.text}</span>}
          </div>)}<div className="print-zone-label">ОБЛАСТЬ ПЕЧАТИ / {active.toUpperCase()}</div>
        </div></div>
        {paint&&<PaintTool areaId={active} onSave={async f=>upload(f,true)} onClose={()=>setPaint(false)} busy={busy}/>}
        <p className="quality-note">Пунктир — край области печати. Реальный оттенок зависит от ткани и технологии печати.</p>
        {outsideLayers.length>0&&<p className="error-box" role="alert">Некоторые слои выходят за края печати. Уменьши или перемести их.</p>}
      </div>
    </div>
    <aside className="studio-sidebar">
      <div className="sidebar-head"><span className="eyebrow">AURA STUDIO</span><h1>Твой дизайн.</h1><p>{product.name}</p></div>
      <div className="sidebar-scroll">
        <div className="editor-group"><h3><span>01</span> Изделие</h3>
          <label className="field-label">Цвет</label><div className="color-row">{product.colors.map(c=><button key={c.name} onClick={()=>d.setOption('color',c.name)} className={'color-choice'+(d.color===c.name?' active':'')} title={c.name} aria-label={c.name} style={{background:c.hex}}/>)}</div>
          <div className="palette-custom"><label>Свой цвет <input type="color" value={color} onChange={e=>d.setOption('color',e.target.value)}/></label><span>{d.color}</span></div>
          <label className="field-label" htmlFor="size">{product.optionLabel||'Размер'}</label><select id="size" value={d.size} onChange={e=>d.setOption('size',e.target.value)}>{product.sizes.map(s=><option key={s}>{s}</option>)}</select>
        </div>
        <div className="editor-group"><h3><span>02</span> Сторона печати</h3><div className="segmented">{product.printAreas.map(a=><button key={a.id} className={active===a.id?'active':''} onClick={()=>{setActive(a.id);setSide(a.id==='back'?'back':'front');setSelected(null);setPaint(false)}}>{a.label}{a.extraPriceRub>0&&<small>+{money(a.extraPriceRub)}</small>}</button>)}</div></div>
        <div className="editor-group"><h3><span>03</span> Инструменты</h3>
          <div className="editor-tools">
            <button onClick={()=>file.current?.click()}><ImagePlus size={17}/> Фото / картинка</button>
            <button onClick={addText}><Type size={17}/> Текст</button>
            <button className={paint?'active':''} onClick={()=>{setPaint(!paint);setSelected(null)}}><Paintbrush size={17}/> Рисовать</button>
          </div>
          <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{if(e.target.files?.[0])void upload(e.target.files[0]);e.target.value=''}}/>
          <p className="tiny">Изображения PNG, JPG, WebP · до 8 МБ</p>
        </div>
        <div className="editor-group"><div className="group-title"><h3><span>04</span> Слои</h3><div><button className="icon-button" aria-label="Отменить" disabled={!d.past.length} onClick={d.undo}><Undo2 size={17}/></button><button className="icon-button" aria-label="Повторить" disabled={!d.future.length} onClick={d.redo}><Redo2 size={17}/></button></div></div>
          {d.layers.length?<div className="layer-list">{d.layers.map((l,i)=><div key={l.id} className={selected===l.id?'active':''}>
            <button className="layer-select" onClick={()=>{setSelected(l.id);setActive(l.areaId);setPaint(false)}}>{l.kind==='image'?<ImagePlus size={16}/>:<Type size={16}/>}<span>{l.kind==='image'?l.image?.name:l.text}</span></button>
            <button className="icon-button" aria-label="Дублировать слой" onClick={()=>{const id=uid();d.addLayer({...l,id,x:clamp(l.x+.04,0,1-l.width),y:clamp(l.y+.04,0,1-l.height)});setSelected(id)}}><Copy size={14}/></button>
            <button className="icon-button" aria-label="Поднять слой" disabled={i===d.layers.length-1} onClick={()=>d.moveLayer(l.id,1)}><ArrowUp size={14}/></button>
            <button className="icon-button" aria-label="Опустить слой" disabled={i===0} onClick={()=>d.moveLayer(l.id,-1)}><ArrowDown size={14}/></button>
            <button className="icon-button" aria-label="Удалить слой" onClick={()=>{d.removeLayer(l.id);setSelected(null)}}><Trash2 size={14}/></button>
          </div>)}</div>:<p className="empty-small">Добавь фото, надпись или рисунок.</p>}
          {selectedLayer&&<div className="layer-properties">
            <strong>Настройки слоя</strong>
            {selectedLayer.kind==='text'&&<>
              <label>Текст<textarea value={selectedLayer.text||''} onChange={e=>update({text:e.target.value})}/></label>
              <div className="prop-grid"><label>Шрифт<select value={selectedLayer.font||'Manrope'} onChange={e=>update({font:e.target.value})}>{fonts.map(f=><option key={f}>{f}</option>)}</select></label><label>Цвет<input type="color" value={selectedLayer.color||'#151515'} onChange={e=>update({color:e.target.value})}/></label></div>
              <div className="preset-palette">{inkColors.map(c=><button key={c} title={c} aria-label={`Цвет ${c}`} className={selectedLayer.color===c?'active':''} style={{background:c}} onClick={()=>update({color:c})}/>)}</div>
              <div className="prop-grid"><label>Размер текста<input type="number" min="12" max="96" value={selectedLayer.fontSize||32} onChange={e=>update({fontSize:clamp(+e.target.value,12,96)})}/></label><label>Межбуквенный интервал<input type="number" min="-2" max="12" value={selectedLayer.letterSpacing||0} onChange={e=>update({letterSpacing:clamp(+e.target.value,-2,12)})}/></label></div>
              <div className="prop-grid"><label>Насыщенность<select value={selectedLayer.weight||700} onChange={e=>update({weight:+e.target.value})}><option value="400">Обычная</option><option value="600">Средняя</option><option value="700">Жирная</option><option value="900">Очень жирная</option></select></label><label>Выравнивание<select value={selectedLayer.align||'center'} onChange={e=>update({align:e.target.value as Layer['align']})}><option value="left">Слева</option><option value="center">По центру</option><option value="right">Справа</option></select></label></div>
              <label className="check-label"><input type="checkbox" checked={!!selectedLayer.italic} onChange={e=>update({italic:e.target.checked})}/> Курсив</label>
            </>}
            <label>Размер принта<input type="range" min=".05" max=".94" step=".01" value={selectedLayer.width} onPointerDown={()=>d.checkpoint()} onChange={e=>{const width=+e.target.value,ratio=selectedLayer.height/selectedLayer.width;d.updateLayer(selectedLayer.id,{width,height:Math.min(.94,width*ratio),x:Math.min(selectedLayer.x,1-width)},false)}}/></label>
            <label>Поворот</label><div className="rotation-controls"><input type="range" min="-180" max="180" step="1" value={selectedLayer.rotation} onPointerDown={()=>d.checkpoint()} onChange={e=>d.updateLayer(selectedLayer.id,{rotation:+e.target.value},false)}/><input type="number" min="-180" max="180" step="1" aria-label="Угол в градусах" value={selectedLayer.rotation} onChange={e=>update({rotation:clamp(+e.target.value,-180,180)})}/></div>
            <button className="text-button" onClick={()=>update({rotation:0})}><RotateCcw size={14}/> Вернуть 0°</button>
            <div className="prop-grid"><label>По горизонтали, %<input type="number" min="0" max="100" value={Math.round(selectedLayer.x*100)} onChange={e=>update({x:clamp(+e.target.value/100,0,1-selectedLayer.width)})}/></label><label>По вертикали, %<input type="number" min="0" max="100" value={Math.round(selectedLayer.y*100)} onChange={e=>update({y:clamp(+e.target.value/100,0,1-selectedLayer.height)})}/></label></div>
            <label>Прозрачность · {Math.round(selectedLayer.opacity*100)}%<input type="range" min="0" max="1" step=".05" value={selectedLayer.opacity} onPointerDown={()=>d.checkpoint()} onChange={e=>d.updateLayer(selectedLayer.id,{opacity:+e.target.value},false)}/></label>
            {selectedLayer.kind==='image'&&<><label className="check-label"><input type="checkbox" checked={!!selectedLayer.flipX} onChange={e=>update({flipX:e.target.checked})}/> Отразить по горизонтали</label>{selectedLayer.image&&<p className="resolution-note">Исходный размер: {selectedLayer.image.width} × {selectedLayer.image.height} пикселей.</p>}</>}
          </div>}
        </div>
        <div className="editor-group"><h3><span>05</span> Название</h3><label className="field-label" htmlFor="design-title">Имя проекта</label><input id="design-title" value={d.title} onChange={e=>d.setOption('title',e.target.value)}/><button className="text-button" onClick={()=>{if(confirm('Очистить все слои?'))d.reset()}}><Trash2 size={15}/> Удалить слои</button></div>
      </div>
      <div className="sidebar-checkout"><div><span>Стоимость изделия</span><strong>{money(price)}</strong></div><p>Доставка рассчитывается при оформлении.</p>{message&&<p role="status" className="form-message">{message}</p>}
        <button className="button button-dark full" disabled={busy} onClick={()=>void save()}><Save size={17}/> Сохранить проект</button>
        <button className="button button-lime full" disabled={busy||outsideLayers.length>0} onClick={()=>void addToCart()}><ShoppingBag size={17}/> Добавить в корзину</button>
      </div>
    </aside>
  </div>;
}
