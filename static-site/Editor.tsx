import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import {ArrowDown, ArrowUp, Download, ImagePlus, Redo2, RotateCcw, Save, ShoppingBag, Trash2, Type, Undo2, Brush, Copy, FlipHorizontal, FlipVertical} from 'lucide-react';
import type {Design, Layer, Product} from '@/lib/types';
import {money} from '@/lib/types';
import {validLayerBounds} from '@/lib/bounds';
import {PaintTool} from './PaintTool';
import {useDesign} from '@/store/design';
import {useCart} from '@/store/cart';
import {loadDesign, saveDesign, saveImage} from './local-data';
import {assetUrl} from './catalog';

const StaticShirt3D = lazy(() => import('./StaticShirt3D'));

function createdDesign(product: Product, state: ReturnType<typeof useDesign.getState>): Design {
  const now = Date.now();
  return {id: state.id || crypto.randomUUID(), ownerId: 'local-browser', productId: product.id,
    color: state.color, size: state.size, layers: state.layers, title: state.title.trim() || 'Мой дизайн',
    isPublic: false, createdAt: now, updatedAt: now};
}

export function Editor({product, designId, navigate}: {product: Product; designId?: string; navigate: (url: string) => void}) {
  const design = useDesign();
  const cart = useCart();
  const [active, setActive] = useState('front');
  const [side, setSide] = useState<'front'|'back'>('front');
  const [selected, setSelected] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [painting, setPainting] = useState(false);
  const [loadedId, setLoadedId] = useState('');
  const zone = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const drag = useRef<{id: string; clientX: number; clientY: number; x: number; y: number} | null>(null);

  useEffect(() => {
    if (designId && loadedId !== designId) {
      void loadDesign(designId).then(saved => {
        if (!saved) throw new Error('Проект не найден в этом браузере.');
        useDesign.getState().load(saved);
        setActive(saved.layers[0]?.areaId || 'front');
        setLoadedId(designId);
      }).catch(error => setMessage((error as Error).message));
    } else if (!designId && (useDesign.getState().productId !== product.id || loadedId)) {
      useDesign.getState().setProduct(product.id, product.colors[0]?.name || 'Графит', product.sizes[0] || 'M');
      setLoadedId('');
    }
  }, [product.id, product.colors, product.sizes, designId, loadedId]);

  const selectedLayer = design.layers.find(layer => layer.id === selected);
  const color = design.color.startsWith('#') ? design.color : product.colors.find(item => item.name === design.color)?.hex || product.colors[0]?.hex || '#252525';
  const area = product.printAreas.find(item => item.id === active) || product.printAreas[0];
  const outside = design.layers.filter(layer => !validLayerBounds(layer));
  const usedAreas = new Set(design.layers.map(layer => layer.areaId));
  const estimate = product.priceRub + [...usedAreas].reduce((sum, id) => sum + (product.printAreas.find(item => item.id === id)?.extraPriceRub || 0), 0);
  const isShirtModel = product.model?.endsWith('/models/aura-tee.glb');

  async function save(): Promise<string | null> {
    if (outside.length) {setMessage('Слой выходит за область печати. Уменьшите его или измените положение.'); return null;}
    setBusy(true);
    try {
      const state = useDesign.getState();
      const record = createdDesign(product, state);
      const scene = stage.current?.querySelector('canvas');
      if (scene) {try {const thumbnail = document.createElement('canvas'); thumbnail.width = 480; thumbnail.height = 360; thumbnail.getContext('2d')?.drawImage(scene, 0, 0, thumbnail.width, thumbnail.height); record.previewUrl = thumbnail.toDataURL('image/webp', .8);} catch { /* Preview is optional. */ }}
      if (state.id) {
        const previous = await loadDesign(state.id);
        if (previous) record.createdAt = previous.createdAt;
      }
      await saveDesign(record);
      state.setId(record.id);
      setMessage('Проект сохранён в этом браузере. Для надёжности скачайте предпросмотр; очистка данных браузера удалит проект.');
      return record.id;
    } catch (error) {setMessage(`Не удалось сохранить проект: ${(error as Error).message}`); return null;}
    finally {setBusy(false);}
  }

  async function upload(file: File, paint = false) {
    setBusy(true);
    try {
      const image = await saveImage(file);
      const width = paint ? 1 : .4, height = paint ? 1 : Math.min(.7, width * image.height / image.width);
      design.addLayer({id: crypto.randomUUID(), kind: 'image', areaId: active, x: paint ? 0 : .3, y: paint ? 0 : .28, width, height, isPaint: paint,
        rotation: 0, opacity: 1, image});
      setMessage('Изображение добавлено. Оригинал хранится только в этом браузере.');
    } catch (error) {setMessage((error as Error).message);}
    finally {setBusy(false);}
  }

  function addText() {
    const id = crypto.randomUUID();
    design.addLayer({id, kind: 'text', areaId: active, x: .18, y: .42, width: .64, height: .12,
      rotation: 0, opacity: 1, text: 'ТВОЙ ТЕКСТ', font: 'Manrope', color: ['#252525','#25334c','#75434a','#446457'].includes(color.toLowerCase()) ? '#ffffff' : '#151515',
      fontSize: 32, letterSpacing: 0, weight: 700, align: 'center'});
    setSelected(id);
  }

  function pointerMove(event: React.PointerEvent) {
    if (!drag.current || !zone.current) return;
    const layer = useDesign.getState().layers.find(item => item.id === drag.current?.id);
    if (!layer) return;
    const bounds = zone.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1 - layer.width, drag.current.x + (event.clientX - drag.current.clientX) / bounds.width));
    const y = Math.max(0, Math.min(1 - layer.height, drag.current.y + (event.clientY - drag.current.clientY) / bounds.height));
    design.updateLayer(layer.id, {x, y}, false);
  }

  function downloadPreview() {
    const canvas = stage.current?.querySelector('canvas');
    if (!canvas) {setMessage('3D-предпросмотр недоступен. Воспользуйтесь 2D-редактором.'); return;}
    try {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'aura-wear-preview.png';
      link.click();
    } catch {setMessage('Не удалось скачать предпросмотр.');}
  }

  if (!area) return <div className="container aw-page"><p role="alert">Для товара не настроена печатная область.</p></div>;

  return <div className="aw-editor">
    <div className="aw-editor-main">
      <div className="aw-3d-stage" ref={stage}>
        <div className="aw-stage-caption"><span>3D / ПРЕДПРОСМОТР</span><span>ВРАЩАЙ · ПРИБЛИЖАЙ</span></div>
        {isShirtModel ? <Suspense fallback={<div className="aw-stage-loading">Загружаем 3D…</div>}>
          <StaticShirt3D key={cameraKey} layers={design.layers} color={color} side={side} autoRotate={autoRotate}/>
        </Suspense> : <div className="aw-fallback"><img src={product.image || assetUrl('images/tee-editorial.webp')} alt={product.name}/><p>Для этого изделия 3D-модель пока не подключена.</p></div>}
        <div className="aw-stage-controls">
          <button onClick={() => setSide('front')} className={side === 'front' ? 'active' : ''}>Спереди</button>
          <button onClick={() => setSide('back')} className={side === 'back' ? 'active' : ''}>Сзади</button>
          {isShirtModel && <><button onClick={() => setAutoRotate(value => !value)} className={autoRotate ? 'active' : ''}>Автовращение</button>
            <button onClick={() => setCameraKey(value => value + 1)} aria-label="Сбросить камеру"><RotateCcw size={16}/></button>
            <button onClick={downloadPreview} aria-label="Скачать предпросмотр"><Download size={16}/></button></>}
        </div>
      </div>
      <section className="aw-workboard"><div className="aw-workboard-head"><div><span className="eyebrow">РЕДАКТОР ПРИНТА</span><h2>{area.label}</h2></div><span>Демо-зона {area.widthMm} × {area.heightMm} мм</span></div>
        <p>Перемещайте слои в пределах печатной области. Стрелки на клавиатуре также передвигают выбранный слой.</p>
        <div className="aw-board-shell"><div className="aw-print-zone" ref={zone} style={{background: color}} onPointerMove={pointerMove} onPointerUp={() => drag.current = null} onPointerCancel={() => drag.current = null}>
          {design.layers.filter(layer => layer.areaId === active).map(layer => <div key={layer.id} role="button" tabIndex={0}
            aria-label={layer.kind === 'image' ? `Изображение ${layer.image?.name}` : `Надпись ${layer.text}`}
            className={`aw-layer${selected === layer.id ? ' selected' : ''}${!validLayerBounds(layer) ? ' outside' : ''}`}
            style={{left: `${layer.x * 100}%`, top: `${layer.y * 100}%`, width: `${layer.width * 100}%`, height: `${layer.height * 100}%`, transform: `rotate(${layer.rotation}deg) scale(${layer.flipX ? -1 : 1}, ${layer.flipY ? -1 : 1})`, opacity: layer.opacity}}
            onPointerDown={event => {event.currentTarget.setPointerCapture(event.pointerId); design.checkpoint(); setSelected(layer.id); drag.current = {id: layer.id, clientX: event.clientX, clientY: event.clientY, x: layer.x, y: layer.y};}}
            onKeyDown={event => {if (!event.key.startsWith('Arrow')) return; event.preventDefault(); const step = event.shiftKey ? .05 : .01; design.updateLayer(layer.id, {x: Math.max(0, Math.min(1 - layer.width, layer.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0))), y: Math.max(0, Math.min(1 - layer.height, layer.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0)))}); setSelected(layer.id);}}>
            {layer.kind === 'image' ? layer.image?.url ? <img src={layer.image.url} alt={layer.image.name} draggable={false}/> : <span>Изображение недоступно</span> : <span style={{fontFamily: layer.font || 'Manrope', fontWeight: layer.weight, fontStyle: layer.italic ? 'italic' : 'normal', fontSize: `${Math.max(12, (layer.fontSize || 30) * .48)}px`, color: layer.color, textAlign: layer.align || 'center', letterSpacing: layer.letterSpacing, whiteSpace: 'pre-wrap'}}>{layer.text}</span>}
          </div>)}
          <span className="aw-zone-mark">PRINT AREA / {active.toUpperCase()}</span>
        </div></div>
        {painting && <PaintTool areaId={active} busy={busy} onClose={() => setPainting(false)} onSave={async file => {await upload(file, true); setPainting(false);}}/>}
        {outside.length > 0 && <p role="alert" className="aw-warning">{outside.length} слой(я) выходят за границы. Сохранение заблокировано.</p>}
      </section>
    </div>
    <aside className="aw-editor-sidebar"><div className="aw-sidebar-scroll">
      <span className="eyebrow">AURA STUDIO / ДЕМО</span><h1>Сделай своим<span>.</span></h1>
      <p>Это локальный макет. Он не отправляется в производство.</p>
      <section className="aw-tool-section"><h2><span>01</span> Изделие</h2><strong>{product.name}</strong><label>Цвет</label><div className="aw-swatches">{product.colors.map(item => <button key={item.name} className={design.color === item.name ? 'active' : ''} style={{background: item.hex}} aria-label={item.name} title={item.name} onClick={() => design.setOption('color', item.name)}/>)}</div><small>{design.color}</small><label>Свой оттенок<input type="color" value={color} onChange={event => design.setOption('color', event.target.value)}/></label>
        <label htmlFor="aw-size">{product.optionLabel || 'Размер'}</label><select id="aw-size" value={design.size} onChange={event => design.setOption('size', event.target.value)}>{product.sizes.map(size => <option key={size}>{size}</option>)}</select></section>
      <section className="aw-tool-section"><h2><span>02</span> Область</h2><div className="aw-segment">{product.printAreas.map(item => <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => {setActive(item.id); setSide(item.id === 'back' ? 'back' : 'front'); setSelected(null);}}>{item.label}</button>)}</div></section>
      <section className="aw-tool-section"><h2><span>03</span> Твой дизайн</h2><div className="aw-add-actions"><button onClick={() => fileInput.current?.click()} disabled={busy}><ImagePlus size={17}/> Загрузить изображение</button><button onClick={addText}><Type size={17}/> Добавить надпись</button><button onClick={() => setPainting(value => !value)}><Brush size={17}/> {painting ? 'Закрыть кисть' : 'Рисовать'}</button></div><input ref={fileInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {if (event.target.files?.[0]) void upload(event.target.files[0]); event.target.value = '';}}/><small>PNG, JPG, WebP · до 8 МБ · только в вашем браузере</small></section>
      <section className="aw-tool-section"><div className="aw-tool-heading"><h2><span>04</span> Слои</h2><div><button aria-label="Отменить" disabled={!design.past.length} onClick={design.undo}><Undo2 size={16}/></button><button aria-label="Повторить" disabled={!design.future.length} onClick={design.redo}><Redo2 size={16}/></button></div></div>
        {design.layers.length ? <div className="aw-layer-list">{design.layers.map((layer, index) => <div key={layer.id} className={selected === layer.id ? 'active' : ''}><button onClick={() => {setSelected(layer.id); setActive(layer.areaId);}}>{layer.kind === 'image' ? <ImagePlus size={15}/> : <Type size={15}/>} <span>{layer.kind === 'image' ? layer.image?.name : layer.text}</span></button><button aria-label="Слой выше" disabled={index === design.layers.length - 1} onClick={() => design.moveLayer(layer.id, 1)}><ArrowUp size={14}/></button><button aria-label="Слой ниже" disabled={index === 0} onClick={() => design.moveLayer(layer.id, -1)}><ArrowDown size={14}/></button><button aria-label="Удалить слой" onClick={() => {design.removeLayer(layer.id); setSelected(null);}}><Trash2 size={14}/></button></div>)}</div> : <p>Добавьте изображение или надпись.</p>}
        {selectedLayer && <div className="aw-properties"><strong>Настройки слоя</strong>
          {selectedLayer.kind === 'text' && <><label>Текст<textarea value={selectedLayer.text || ''} onChange={event => design.updateLayer(selectedLayer.id, {text: event.target.value})}/></label><div className="aw-two"><label>Шрифт<select value={selectedLayer.font || 'Manrope'} onChange={event => design.updateLayer(selectedLayer.id, {font: event.target.value})}><option>Manrope</option><option>IBM Plex Sans</option><option>Rubik</option><option>Unbounded</option><option>Noto Serif</option><option>Oswald</option></select></label><label>Цвет<input type="color" value={selectedLayer.color || '#151515'} onChange={event => design.updateLayer(selectedLayer.id, {color: event.target.value})}/></label></div><div className="aw-two"><label>Размер<input type="number" min="12" max="96" value={selectedLayer.fontSize || 32} onChange={event => design.updateLayer(selectedLayer.id, {fontSize: Number(event.target.value)})}/></label><label>Интервал<input type="number" min="-2" max="12" value={selectedLayer.letterSpacing || 0} onChange={event => design.updateLayer(selectedLayer.id, {letterSpacing: Number(event.target.value)})}/></label></div><div className="aw-two"><label>Толщина<select value={selectedLayer.weight || 700} onChange={event => design.updateLayer(selectedLayer.id, {weight: Number(event.target.value)})}><option value="400">Обычная</option><option value="600">Средняя</option><option value="700">Жирная</option></select></label><label>Выравнивание<select value={selectedLayer.align || 'center'} onChange={event => design.updateLayer(selectedLayer.id, {align: event.target.value as Layer['align']})}><option value="left">Слева</option><option value="center">Центр</option><option value="right">Справа</option></select></label></div><label className="aw-check"><input type="checkbox" checked={!!selectedLayer.italic} onChange={event => design.updateLayer(selectedLayer.id, {italic: event.target.checked})}/> Курсив</label></>}
          <label>Масштаб<input type="range" min=".05" max=".9" step=".01" value={selectedLayer.width} onChange={event => {const width = Number(event.target.value), ratio = selectedLayer.height / selectedLayer.width; design.updateLayer(selectedLayer.id, {width, height: Math.min(.9, width * ratio), x: Math.min(selectedLayer.x, 1 - width)});}}/></label>
          <label>Поворот · {selectedLayer.rotation}°<input type="range" min="-180" max="180" value={selectedLayer.rotation} onChange={event => design.updateLayer(selectedLayer.id, {rotation: Number(event.target.value)})}/></label><div className="aw-two"><label>Угол, °<input type="number" min="-180" max="180" value={selectedLayer.rotation} onChange={event => design.updateLayer(selectedLayer.id, {rotation: Math.max(-180, Math.min(180, Number(event.target.value)))})}/></label><button type="button" onClick={() => design.updateLayer(selectedLayer.id, {rotation: 0})}>Сбросить угол</button></div><div className="aw-property-actions"><button onClick={() => {const id = crypto.randomUUID(); design.addLayer({...selectedLayer, id, x: Math.min(.9, selectedLayer.x + .05), y: Math.min(.9, selectedLayer.y + .05)}); setSelected(id);}}><Copy size={14}/> Дублировать</button><button onClick={() => design.updateLayer(selectedLayer.id, {flipX: !selectedLayer.flipX})}><FlipHorizontal size={14}/> Отразить X</button><button onClick={() => design.updateLayer(selectedLayer.id, {flipY: !selectedLayer.flipY})}><FlipVertical size={14}/> Отразить Y</button><button onClick={() => design.updateLayer(selectedLayer.id, {x: (1 - selectedLayer.width) / 2, y: (1 - selectedLayer.height) / 2})}>По центру</button></div>
          <label>Прозрачность · {Math.round(selectedLayer.opacity * 100)}%<input type="range" min="0" max="1" step=".05" value={selectedLayer.opacity} onChange={event => design.updateLayer(selectedLayer.id, {opacity: Number(event.target.value)})}/></label>
          {selectedLayer.kind === 'image' && selectedLayer.image && <small>Исходник: {selectedLayer.image.width} × {selectedLayer.image.height} px. {(selectedLayer.image.width < selectedLayer.width * area.widthMm / 25.4 * area.minDpi || selectedLayer.image.height < selectedLayer.height * area.heightMm / 25.4 * area.minDpi) && <b>Низкое разрешение для печати.</b>}</small>}
        </div>}
      </section>
      <section className="aw-tool-section"><h2><span>05</span> Проект</h2><label htmlFor="aw-title">Название</label><input id="aw-title" value={design.title} onChange={event => design.setOption('title', event.target.value)}/><button className="aw-reset" onClick={() => {if (window.confirm('Удалить все слои проекта?')) design.reset();}}><Trash2 size={15}/> Сбросить дизайн</button></section>
    </div><div className="aw-editor-footer"><div><span>{product.previewOnly ? 'Предпросмотр' : 'Условная стоимость'}</span><strong>{product.previewOnly ? 'Без оплаты' : money(estimate)}</strong></div><small>Не является предложением о продаже. Итог и доставка здесь не рассчитываются.</small>{message && <p role="status" className="aw-message">{message}</p>}<button className="button button-dark full" disabled={busy} onClick={() => void save()}><Save size={17}/> Сохранить в браузере</button><button className="button button-lime full" disabled={busy} onClick={() => void (async () => {const id = await save(); if (id) {cart.add({designId: id, productId: product.id, quantity: 1}); navigate('/cart');}})()}><ShoppingBag size={17}/> Добавить в демо-корзину</button></div></aside>
  </div>;
}
