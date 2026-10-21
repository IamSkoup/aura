'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLine } from '@/lib/types';
type CartState={lines:CartLine[];add:(line:CartLine)=>void;remove:(designId:string)=>void;quantity:(designId:string,quantity:number)=>void;clear:()=>void};
export const useCart=create<CartState>()(persist((set)=>({lines:[],add:(line)=>set(s=>{const exists=s.lines.find(l=>l.designId===line.designId);return {lines:exists?s.lines.map(l=>l.designId===line.designId?{...l,quantity:Math.min(10,l.quantity+line.quantity)}:l):[...s.lines,line]}}),remove:(id)=>set(s=>({lines:s.lines.filter(l=>l.designId!==id)})),quantity:(id,q)=>set(s=>({lines:s.lines.map(l=>l.designId===id?{...l,quantity:Math.max(1,Math.min(10,q))}:l)})),clear:()=>set({lines:[]})}),{name:'aura-cart'}));
