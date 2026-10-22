'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLine } from '@/lib/types';
import {firebaseAuth} from '../firebase';
type CartState={lines:CartLine[];add:(line:CartLine)=>void;remove:(designId:string)=>void;quantity:(designId:string,quantity:number)=>void;claimLegacy:(uid:string)=>void;clear:()=>void};
export const useCart=create<CartState>()(persist((set)=>({lines:[],add:(line)=>set(s=>{const owned={...line,ownerId:firebaseAuth.currentUser?.uid};const exists=s.lines.find(l=>l.designId===line.designId);return {lines:exists?s.lines.map(l=>l.designId===line.designId?{...l,quantity:Math.min(10,l.quantity+line.quantity)}:l):[...s.lines,owned]}}),remove:(id)=>set(s=>({lines:s.lines.filter(l=>l.designId!==id)})),quantity:(id,q)=>set(s=>({lines:s.lines.map(l=>l.designId===id?{...l,quantity:Math.max(1,Math.min(10,q))}:l)})),claimLegacy:(uid)=>set(s=>({lines:s.lines.map(line=>line.ownerId?line:{...line,ownerId:uid})})),clear:()=>set({lines:[]})}),{name:'aura-cart'}));
