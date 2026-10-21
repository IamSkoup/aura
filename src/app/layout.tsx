import type { Metadata } from 'next';
import '@fontsource-variable/manrope/index.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/600.css';
import './globals.css';
import './aura-theme.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Shell } from '@/components/Shell';
export const metadata:Metadata={title:{default:'Aura Wear — Твой стиль. Твои правила.',template:'%s | Aura Wear'},description:'Создавай одежду и аксессуары со своим дизайном. 3D-конструктор, личные проекты и заказ в одном месте.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`try{var t=localStorage.getItem('aura-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}`}}/></head><body><AuthProvider><Shell>{children}</Shell></AuthProvider></body></html>}
