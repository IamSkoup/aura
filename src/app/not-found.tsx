import Link from 'next/link';
export default function NotFound(){return <div className="container not-found"><span className="eyebrow">СТРАНИЦА НЕ НАЙДЕНА</span><h1>404<span>.</span></h1><p>Похоже, эта идея ушла другой дорогой.</p><Link className="button button-lime" href="/">На главную</Link></div>}
