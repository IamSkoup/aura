'use client';
import {useAuth} from './AuthProvider';
import Link from 'next/link';
import {AccountNav} from './AccountNav';
export function AccountGuard({children,title}:{children:React.ReactNode;title:string}){const {user,loading}=useAuth();if(loading)return <div className="container section skeleton"/>;if(!user)return <div className="container section empty-state"><h1>Войди в аккаунт</h1><p>Этот раздел доступен после входа.</p><Link className="button button-lime" href="/login">Войти</Link></div>;return <div className="container account-layout"><AccountNav/><div className="account-content"><span className="eyebrow">ЛИЧНОЕ ПРОСТРАНСТВО</span><h1>{title}</h1>{children}</div></div>}
