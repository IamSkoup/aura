import type {Layer} from '@/lib/types';

export type PrintTemplate = {id: string; title: string; category: string; subtitle: string; ink: string; paper: string; symbol: string};
export const printCategories = ['Все', 'Мемы', 'Цитаты', 'Минимализм', 'Аниме', 'Праздники', 'Авторские'];
export const printTemplates: PrintTemplate[] = [
  {id:'offline',title:'OFFLINE',category:'Мемы',subtitle:'режим: не беспокоить',ink:'#151515',paper:'#c9ff48',symbol:'✳'},
  {id:'own-pace',title:'СВОЙ ТЕМП',category:'Цитаты',subtitle:'двигайся как чувствуешь',ink:'#f7f6f2',paper:'#273527',symbol:'↗'},
  {id:'form-01',title:'FORM 01',category:'Минимализм',subtitle:'less, but yours',ink:'#151515',paper:'#e8e3d7',symbol:'◉'},
  {id:'neon-arc',title:'NEON ARC',category:'Аниме',subtitle:'оригинальная графика AURA',ink:'#d5ff69',paper:'#20283b',symbol:'✦'},
  {id:'new-day',title:'НОВЫЙ ДЕНЬ',category:'Праздники',subtitle:'праздник по-своему',ink:'#f7f6f2',paper:'#a74d42',symbol:'✳'},
  {id:'aura-signal',title:'AURA SIGNAL',category:'Авторские',subtitle:'studio edition',ink:'#151515',paper:'#c9ff48',symbol:'≈'},
];
const escapeXml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export function templateImage(t: PrintTemplate) {
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000"><rect width="1000" height="1000" rx="80" fill="'+t.paper+'"/><circle cx="780" cy="240" r="170" fill="none" stroke="'+t.ink+'" stroke-opacity=".33" stroke-width="10"/><text x="78" y="160" fill="'+t.ink+'" font-family="Arial,sans-serif" font-size="40" font-weight="700" letter-spacing="12">AURA / STUDIO</text><text x="80" y="530" fill="'+t.ink+'" font-family="Arial,sans-serif" font-size="195" font-weight="800">'+escapeXml(t.symbol)+'</text><text x="80" y="740" fill="'+t.ink+'" font-family="Arial,sans-serif" font-size="90" font-weight="800">'+escapeXml(t.title)+'</text><path d="M80 785H920" stroke="'+t.ink+'" stroke-width="8"/><text x="80" y="865" fill="'+t.ink+'" font-family="Arial,sans-serif" font-size="34" font-weight="600">'+escapeXml(t.subtitle)+'</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
export function templateLayer(t: PrintTemplate): Layer {
  return {id:crypto.randomUUID(),kind:'image',areaId:'front',x:.16,y:.22,width:.68,height:.54,rotation:0,opacity:1,image:{assetId:t.id,url:templateImage(t),width:1000,height:1000,name:t.title}};
}
