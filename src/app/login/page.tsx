'use client';
import {Suspense,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,signInWithEmailAndPassword,updateProfile} from 'firebase/auth';
import {auth} from '@/lib/firebase-client';

function friendlyError(error:unknown){
  const code=(error as {code?:string})?.code||'';
  const messages:Record<string,string>={
    'auth/invalid-credential':'Неверный email или пароль.',
    'auth/wrong-password':'Неверный пароль.',
    'auth/user-not-found':'Аккаунт с таким email не найден.',
    'auth/email-already-in-use':'Этот email уже зарегистрирован. Попробуй войти.',
    'auth/weak-password':'Пароль слишком короткий. Выбери более надёжный.',
    'auth/invalid-email':'Проверь адрес электронной почты.',
    'auth/too-many-requests':'Слишком много попыток. Попробуй позже.',
    'auth/network-request-failed':'Не удалось подключиться. Проверь интернет и попробуй ещё раз.',
    'auth/operation-not-allowed':'Регистрация пока недоступна. Свяжись с магазином.',
  };
  return messages[code]||'Не удалось выполнить действие. Попробуй ещё раз.';
}
function Login(){
  const router=useRouter(),params=useSearchParams();
  const [mode,setMode]=useState<'login'|'register'|'reset'>('login');
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();setBusy(true);setMessage('');
    try{
      if(mode==='reset'){await sendPasswordResetEmail(auth,email);setMessage('Если адрес зарегистрирован, тебе придёт письмо для восстановления пароля.');return}
      if(mode==='register'){
        const result=await createUserWithEmailAndPassword(auth,email,password);await updateProfile(result.user,{displayName:name});
        if(!process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST)await sendEmailVerification(result.user);
      }else await signInWithEmailAndPassword(auth,email,password);
      const destination=params.get('next');router.push(destination?.startsWith('/')&&!destination.startsWith('//')?destination:'/account');
    }catch(e){setMessage(friendlyError(e))}finally{setBusy(false)}
  };
  return <div className="auth-page">
    <div className="auth-aside"><span className="eyebrow">AURA / ЛИЧНОЕ ПРОСТРАНСТВО</span><h1>Твои идеи<br/><em>всегда с тобой.</em></h1><p>Сохраняй проекты, возвращайся к ним и следи за заказами в одном месте.</p></div>
    <div className="auth-form-wrap"><form className="auth-form" onSubmit={e=>void submit(e)}>
      <span className="eyebrow">ЛИЧНЫЙ КАБИНЕТ</span><h2>{mode==='login'?'С возвращением.':mode==='register'?'Создай аккаунт.':'Восстановление доступа.'}</h2>
      {mode==='register'&&<label>Имя<input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label>}
      <label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
      {mode!=='reset'&&<label>Пароль<input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='register'?'new-password':'current-password'}/></label>}
      {message&&<p role="alert" className="form-message">{message}</p>}
      <button className="button button-lime full" disabled={busy} type="submit">{busy?'Подожди…':mode==='login'?'Войти':mode==='register'?'Зарегистрироваться':'Отправить письмо'}</button>
      <div className="auth-switch">{mode==='login'?<><button type="button" onClick={()=>setMode('reset')}>Забыли пароль?</button><button type="button" onClick={()=>setMode('register')}>Создать аккаунт</button></>:<button type="button" onClick={()=>setMode('login')}>Вернуться ко входу</button>}</div>
      <p className="tiny">Регистрируясь, ты принимаешь <Link href="/info/legal">условия обработки данных</Link>.</p>
    </form></div>
  </div>;
}
export default function LoginPage(){return <Suspense fallback={<div className="skeleton stage-skeleton"/>}><Login/></Suspense>}
