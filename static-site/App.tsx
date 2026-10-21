import {useEffect, useState} from 'react';
import {onAuthStateChanged, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User} from 'firebase/auth';
import {ArrowRight, ArrowUpRight, Box, Heart, Menu, Minus, Palette, Plus, Rotate3D, ShoppingBag, Sparkles, Trash2, X} from 'lucide-react';
import type {Design, Product} from '@/lib/types';
import {money} from '@/lib/types';
import {useCart} from '@/store/cart';
import {assetUrl, demoTee, loadCatalog} from './catalog';
import {firebaseAuth} from './firebase';
import {deleteDesign, listDesigns, loadDesign} from './local-data';
import {Editor} from './Editor';

const categories = ['Все', 'Футболки', 'Худи', 'Свитшоты', 'Кружки', 'Чехлы', 'Постеры'];

function useRoute() {
  const read = () => window.location.hash.slice(1) || '/';
  const [route, setRoute] = useState(read);
  useEffect(() => {const update = () => {setRoute(read()); window.scrollTo(0, 0);}; window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update);}, []);
  return route;
}

function go(path: string) {window.location.hash = path;}
function Link({to, children, className = '', ...props}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {to: string}) {return <a href={`#${to}`} className={className} {...props}>{children}</a>;}

export default function App() {
  const route = useRoute();
  const [products, setProducts] = useState<Product[]>([demoTee]);
  const [catalogNotice, setCatalogNotice] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useCart(state => state.lines.reduce((sum, line) => sum + line.quantity, 0));
  useEffect(() => {void loadCatalog().then(data => {setProducts(data.products); setCatalogNotice(data.notice);});}, []);
  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);
  useEffect(() => {setMenuOpen(false);}, [route]);
  const [path, search = ''] = route.split('?');
  const params = new URLSearchParams(search);
  const selectedProduct = products.find(product => product.id === params.get('product')) || demoTee;
  return <>
    <div className="aw-demo-ribbon" role="status">ДЕМОНСТРАЦИОННЫЙ САЙТ · ЗАКАЗЫ И ОПЛАТА НЕ ПРИНИМАЮТСЯ <Link to="/about-demo">Подробнее <ArrowUpRight size={12}/></Link></div>
    <header className="aw-header"><div className="container aw-header-inner"><Link className="brand" to="/" aria-label="Aura Wear, главная">AURA<span className="brand-dot">.</span><small>WEAR</small></Link>
      <nav className={menuOpen ? 'aw-nav open' : 'aw-nav'} aria-label="Главное меню"><Link to="/catalog">Каталог</Link><Link to="/studio">Конструктор</Link><Link to="/prints">Готовые дизайны</Link><Link to="/designs">Мои проекты</Link></nav>
      <div className="aw-header-actions"><Link to="/login" aria-label="Аккаунт Firebase">{user ? user.email?.split('@')[0] : 'Войти'}</Link><Link className="aw-bag" to="/cart" aria-label={`Корзина, ${count} товаров`}><ShoppingBag size={20}/>{count > 0 && <b>{count}</b>}</Link><button className="aw-menu-button" onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}>{menuOpen ? <X/> : <Menu/>}</button></div>
    </div></header>
    <main id="main">
      {path === '/' ? <Home/> :
       path === '/catalog' ? <Catalog products={products} notice={catalogNotice} initialCategory={params.get('category') || 'Все'}/> :
       path === '/product' ? <ProductPage product={products.find(product => product.id === params.get('id')) || demoTee}/> :
       path === '/studio' ? <Editor key={`${selectedProduct.id}:${params.get('id') || ''}`} product={selectedProduct} designId={params.get('id') || undefined} navigate={go}/> :
       path === '/cart' ? <Cart products={products}/> :
       path === '/designs' ? <SavedDesigns products={products}/> :
       path === '/login' ? <Login user={user}/> :
       path === '/prints' ? <Prints/> :
       path === '/about-demo' ? <AboutDemo/> :
       <NotFound/>}
    </main>
    <footer className="aw-footer"><div className="container aw-footer-grid"><div><Link className="brand" to="/">AURA<span className="brand-dot">.</span><small>WEAR</small></Link><p>Твой стиль. Твои правила.<br/>Статический предпросмотр магазина.</p></div><div><strong>ИССЛЕДУЙ</strong><Link to="/catalog">Каталог</Link><Link to="/studio">Конструктор</Link><Link to="/designs">Мои проекты</Link></div><div><strong>ИНФОРМАЦИЯ</strong><Link to="/about-demo">О демоверсии</Link><a href="https://github.com/IamSkoup/aura" target="_blank" rel="noreferrer">Исходный код</a></div></div><div className="container aw-footer-bottom"><span>© {new Date().getFullYear()} AURA WEAR</span><span>Заказы, оплата и доставка отключены</span></div></footer>
  </>;
}

function Home() {return <>
  <section className="aw-hero"><div className="container aw-hero-grid"><div className="aw-hero-copy"><span className="eyebrow aw-lime-text">ПРОСТРАНСТВО ДЛЯ ТВОЕЙ ИДЕИ</span><h1>AURA<br/><em>WEAR<span>.</span></em></h1><p className="aw-hero-tag">Твой стиль. Твои правила.</p><p>Создавай одежду и аксессуары, которых больше ни у кого нет. Загрузите свой принт, добавьте надпись и посмотрите результат в 3D.</p><div className="aw-hero-actions"><Link className="button button-lime" to="/studio">Создать свой дизайн <ArrowUpRight size={18}/></Link><Link className="button button-outline-light" to="/catalog">Смотреть каталог <ArrowRight size={18}/></Link></div><small>Прототип: проекты остаются только в вашем браузере</small></div><div className="aw-hero-visual"><div className="aw-orbit"/><img src={assetUrl('images/aura-tee.png')} alt="3D-модель футболки Aura Wear"/><span className="aw-art-top">YOUR CANVAS<br/>YOUR RULES</span><span className="aw-art-bottom">AURA / STUDIO 01</span></div></div></section>
  <section className="container aw-home-section"><div className="aw-section-heading"><div><span className="eyebrow">01 / ОСНОВА</span><h2>Выбери свой <em>холст.</em></h2></div><p>Сейчас полноценная 3D-модель подготовлена для футболки. Остальные категории появятся после добавления реальных товаров и моделей.</p></div><div className="aw-category-grid">{categories.slice(1).map((category, index) => <Link key={category} to={`/catalog?category=${encodeURIComponent(category)}`} className="aw-category"><small>0{index + 1} / 06</small><Box size={40} strokeWidth={1}/><strong>{category}</strong><ArrowUpRight size={22}/></Link>)}</div></section>
  <section className="aw-steps"><div className="container"><div className="aw-section-heading"><div><span className="eyebrow aw-lime-text">02 / ТРИ ШАГА</span><h2>От идеи до <em>макета.</em></h2></div></div><div className="aw-step-grid"><article><b>01</b><Box/><h3>Выберите изделие</h3><p>Начните с демонстрационной футболки или откройте опубликованный каталог.</p></article><article><b>02</b><Palette/><h3>Добавьте принт</h3><p>Изображение и текст можно двигать, масштабировать и размещать спереди или сзади.</p></article><article><b>03</b><Rotate3D/><h3>Посмотрите в 3D</h3><p>Поверните изделие и сохраните свой вариант в браузере.</p></article></div></div></section>
  <section className="container aw-promo"><div><img src={assetUrl('images/aura-tee.png')} alt="Демонстрационная футболка"/></div><div><span className="eyebrow">AURA STUDIO</span><h2>Твоя идея<br/>в центре внимания.</h2><p>Меняйте цвет, добавляйте слои и смотрите принт на UV-поверхности 3D-модели. Это предпросмотр, а не производственный файл.</p><Link className="button button-dark" to="/studio">Открыть конструктор <ArrowUpRight size={18}/></Link></div></section>
  <section className="aw-final-cta"><div className="container"><span className="eyebrow">ТВОЯ АУРА</span><h2>Хватит искать свой стиль.<br/><em>Создай его.</em></h2><Link className="button button-lime" to="/studio">Открыть конструктор <ArrowUpRight size={18}/></Link></div></section>
</>}

function Catalog({products, notice, initialCategory}: {products: Product[]; notice: string; initialCategory: string}) {
  const [category, setCategory] = useState(initialCategory);
  const [text, setText] = useState('');
  const [sort, setSort] = useState('name');
  useEffect(() => setCategory(initialCategory), [initialCategory]);
  const filtered = products.filter(product => (category === 'Все' || product.category === category) && `${product.name} ${product.description}`.toLowerCase().includes(text.toLowerCase()));
  filtered.sort((a, b) => sort === 'price-up' ? a.priceRub - b.priceRub : sort === 'price-down' ? b.priceRub - a.priceRub : a.name.localeCompare(b.name, 'ru'));
  return <div className="container aw-page"><div className="aw-page-head"><span className="eyebrow">AURA / КАТАЛОГ</span><h1>Основа для <em>идеи.</em></h1><p>Фильтруйте опубликованные товары. Демонстрационная футболка показана отдельно и не продаётся.</p></div>
    <div className="aw-catalog-tools"><label>Поиск<input value={text} onChange={event => setText(event.target.value)} placeholder="Название или описание"/></label><label>Категория<select value={category} onChange={event => setCategory(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></label><label>Сортировка<select value={sort} onChange={event => setSort(event.target.value)}><option value="name">По названию</option><option value="price-up">Условная цена ↑</option><option value="price-down">Условная цена ↓</option></select></label></div>
    {notice && <p className="aw-info" role="status">{notice}</p>}
    {filtered.length ? <div className="aw-product-grid">{filtered.map(product => <article className="aw-product-card" key={product.id}><Link to={`/product?id=${encodeURIComponent(product.id)}`}><div className="aw-product-image"><img src={product.image} alt={product.name}/>{product.id === demoTee.id && <span>ДЕМО</span>}</div><div className="aw-product-meta"><h2>{product.name}</h2><span>{money(product.priceRub)}*</span></div></Link><p>{product.category}</p><Link to={`/studio?product=${encodeURIComponent(product.id)}`} className="aw-card-action">Создать дизайн <ArrowUpRight size={17}/></Link></article>)}</div> : <div className="aw-empty"><Box size={32}/><h2>Пока пусто</h2><p>В этой категории ещё нет опубликованных товаров.</p><button className="button button-dark" onClick={() => {setCategory('Все'); setText('');}}>Смотреть все</button></div>}
    <p className="aw-fineprint">* На демонстрационном товаре цена условная. Покупка и расчёт доставки недоступны.</p>
  </div>;
}

function ProductPage({product}: {product: Product}) {return <div className="container aw-page aw-product-detail"><div className="aw-product-detail-image"><img src={product.image} alt={product.name}/></div><div><span className="eyebrow">{product.category} / AURA WEAR</span><h1>{product.name}</h1><p>{product.description}</p><strong>{money(product.priceRub)} {product.id === demoTee.id && <small>· условно</small>}</strong><div className="aw-product-options"><span>Цвета</span><div className="aw-swatches">{product.colors.map(item => <i title={item.name} key={item.name} style={{background: item.hex}}/>)}</div><span>{product.optionLabel || 'Размеры'}</span><div>{product.sizes.join(' · ')}</div></div><Link className="button button-lime" to={`/studio?product=${encodeURIComponent(product.id)}`}>Открыть конструктор <ArrowUpRight size={17}/></Link><p className="aw-fineprint">Это статический предпросмотр. Товар нельзя заказать на GitHub Pages.</p></div></div>}

function Cart({products}: {products: Product[]}) {
  const cart = useCart();
  const [designs, setDesigns] = useState<Record<string, Design | null>>({});
  useEffect(() => {let active = true; void Promise.all(cart.lines.map(async line => [line.designId, await loadDesign(line.designId)] as const)).then(pairs => {if (active) setDesigns(Object.fromEntries(pairs));}).catch(() => {}); return () => {active = false;};}, [cart.lines]);
  const total = cart.lines.reduce((sum, line) => {const product = products.find(item => item.id === line.productId) || demoTee; const design = designs[line.designId]; const areas = new Set(design?.layers.map(layer => layer.areaId) || []); return sum + line.quantity * (product.priceRub + [...areas].reduce((n, area) => n + (product.printAreas.find(item => item.id === area)?.extraPriceRub || 0), 0));}, 0);
  return <div className="container aw-page"><div className="aw-page-head"><span className="eyebrow">AURA / КОРЗИНА</span><h1>Твои <em>идеи.</em></h1><p>Корзина сохраняется в этом браузере. Оформление и оплата отключены.</p></div>
    {!cart.lines.length ? <div className="aw-empty"><ShoppingBag size={32}/><h2>Корзина пуста</h2><Link className="button button-lime" to="/catalog">В каталог</Link></div> : <div className="aw-cart-layout"><div className="aw-cart-items">{cart.lines.map(line => {const product = products.find(item => item.id === line.productId) || demoTee; const design = designs[line.designId]; return <article className="aw-cart-row" key={line.designId}><img src={product.image} alt={product.name}/><div><span className="eyebrow">ДЕМО-ПРОЕКТ</span><h2>{design?.title || 'Сохранённый дизайн'}</h2><p>{product.name} · {design?.color || '—'} · {design?.size || '—'}</p><Link to={`/studio?product=${encodeURIComponent(product.id)}&id=${line.designId}`}>Редактировать дизайн <ArrowUpRight size={14}/></Link></div><div className="aw-cart-end"><div className="aw-quantity"><button aria-label="Уменьшить количество" onClick={() => cart.quantity(line.designId, line.quantity - 1)}><Minus size={15}/></button><span>{line.quantity}</span><button aria-label="Увеличить количество" onClick={() => cart.quantity(line.designId, line.quantity + 1)}><Plus size={15}/></button></div><button className="aw-icon-btn" aria-label="Удалить из корзины" onClick={() => cart.remove(line.designId)}><Trash2 size={18}/></button></div></article>;})}</div><aside className="aw-cart-summary"><span className="eyebrow">ИТОГО / ДЕМО</span><h2>Макеты готовы.</h2><div><span>Условная сумма</span><strong>{money(total)}</strong></div><p>Это пример расчёта без серверной проверки, доставки и оплаты. Заказ не отправляется продавцу.</p><button className="button button-dark full" disabled>Оформление недоступно</button><Link to="/about-demo">Как появятся настоящие заказы <ArrowUpRight size={14}/></Link></aside></div>}
  </div>;
}

function SavedDesigns({products}: {products: Product[]}) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {void listDesigns().then(items => Promise.all(items.map(item => loadDesign(item.id)))).then(items => setDesigns(items.filter((item): item is Design => !!item))).catch(error => setError((error as Error).message));}, []);
  async function remove(id: string) {if (!window.confirm('Удалить сохранённый проект?')) return; try {await deleteDesign(id); useCart.getState().remove(id); setDesigns(items => items.filter(item => item.id !== id));} catch (error) {setError((error as Error).message);}}
  return <div className="container aw-page"><div className="aw-page-head"><span className="eyebrow">AURA / ЛОКАЛЬНЫЕ ПРОЕКТЫ</span><h1>Мои <em>дизайны.</em></h1><p>Проекты и исходные изображения хранятся в этом браузере. При очистке данных сайта они исчезнут.</p></div>{error && <p role="alert" className="aw-warning">{error}</p>}
    {designs.length ? <div className="aw-saved-grid">{designs.map(design => {const product = products.find(item => item.id === design.productId) || demoTee; const firstImage = design.layers.find(layer => layer.image?.url)?.image?.url; return <article key={design.id}><div className="aw-saved-image"><img src={firstImage || product.image} alt={design.title}/></div><div><span className="eyebrow">{product.name}</span><h2>{design.title}</h2><p>{design.color} · {design.size} · {new Date(design.updatedAt).toLocaleDateString('ru-RU')}</p><div><Link className="button button-dark" to={`/studio?product=${encodeURIComponent(product.id)}&id=${design.id}`}>Редактировать</Link><button className="aw-icon-btn" aria-label={`Удалить ${design.title}`} onClick={() => void remove(design.id)}><Trash2 size={18}/></button></div></div></article>;})}</div> : <div className="aw-empty"><Heart size={32}/><h2>Пока нет проектов</h2><Link className="button button-lime" to="/studio">Создать дизайн</Link></div>}
  </div>;
}

function Login({user}: {user: User | null}) {
  const [mode, setMode] = useState<'login'|'register'|'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {event.preventDefault(); setBusy(true); setMessage(''); try {if (mode === 'register') {const account = await createUserWithEmailAndPassword(firebaseAuth, email, password); await sendEmailVerification(account.user); setMessage('Аккаунт создан. Письмо для подтверждения email отправлено.');} else if (mode === 'reset') {await sendPasswordResetEmail(firebaseAuth, email); setMessage('Если адрес зарегистрирован, письмо для восстановления отправлено.');} else {await signInWithEmailAndPassword(firebaseAuth, email, password); setMessage('Вход выполнен. Локальные проекты остаются только в этом браузере.');}} catch (error) {const code = (error as {code?: string}).code || 'auth/unknown'; setMessage(`Не удалось выполнить действие: ${code}. Проверьте настройки Firebase Authentication и разрешённый домен.`);} finally {setBusy(false);}}
  return <div className="container aw-page aw-auth"><div><span className="eyebrow">AURA / FIREBASE AUTHENTICATION</span><h1>Твой аккаунт<span>.</span></h1><p>Вход нужен для будущего магазина и опубликованного каталога. Демопроекты хранятся локально и не синхронизируются с аккаунтом.</p><Sparkles size={72} strokeWidth={.8}/></div><section>{user ? <><h2>Вы вошли</h2><p>{user.email}</p><p>Email {user.emailVerified ? 'подтверждён' : 'не подтверждён'}.</p>{!user.emailVerified && <button className="button button-outline" onClick={() => void sendEmailVerification(user).then(() => setMessage('Письмо отправлено.')).catch(error => setMessage((error as Error).message))}>Отправить письмо повторно</button>}<button className="button button-dark" onClick={() => void signOut(firebaseAuth)}>Выйти</button></> : <><h2>{mode === 'login' ? 'Войти' : mode === 'register' ? 'Создать аккаунт' : 'Восстановить пароль'}</h2><form onSubmit={event => void submit(event)}><label>Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email"/></label>{mode !== 'reset' && <label>Пароль<input required type="password" minLength={6} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'}/></label>}<button className="button button-lime full" disabled={busy}>{mode === 'login' ? 'Войти' : mode === 'register' ? 'Зарегистрироваться' : 'Отправить письмо'}</button></form><div className="aw-auth-switch"><button onClick={() => setMode('login')}>Вход</button><button onClick={() => setMode('register')}>Регистрация</button><button onClick={() => setMode('reset')}>Забыли пароль?</button></div></>}{message && <p role="status" className="aw-info">{message}</p>}</section></div>;
}

function Prints() {return <div className="container aw-page"><div className="aw-page-head"><span className="eyebrow">AURA / КОЛЛЕКЦИЯ</span><h1>Готовые <em>дизайны.</em></h1><p>Авторские принты появятся после подтверждения прав на изображения и подключения хранилища. Сейчас коллекция пуста.</p></div><div className="aw-empty"><Palette size={32}/><h2>Принты ещё не опубликованы</h2><p>Создайте собственный дизайн в конструкторе.</p><Link className="button button-lime" to="/studio">Открыть конструктор</Link></div></div>}
function AboutDemo() {return <div className="container aw-page aw-about"><div className="aw-page-head"><span className="eyebrow">AURA / ЧЕСТНЫЙ РЕЖИМ</span><h1>Что работает <em>сейчас.</em></h1></div><div className="aw-about-grid"><article><Rotate3D/><h2>Работает</h2><p>Каталог, 3D-модель футболки, загрузка фото, надписи, слои, цвета, размеры, сохранение проектов и корзина в этом браузере. Опубликованные товары могут загружаться напрямую из Firebase Realtime Database.</p></article><article><ShoppingBag/><h2>Пока демонстрация</h2><p>Условная сумма в корзине не является ценой продажи. Сайт не принимает платежи и не отправляет заказы. Фото не загружаются в Firebase или другое платное хранилище.</p></article><article><Box/><h2>Для запуска продаж</h2><p>Потребуются реальные товары и сведения о продавце, документы, сервер Next.js, защищённое файловое хранилище и платёжный провайдер. Пошаговая инструкция находится в README репозитория.</p></article></div><Link className="button button-lime" to="/studio">Попробовать конструктор <ArrowUpRight size={17}/></Link></div>}
function NotFound() {return <div className="container aw-page aw-empty"><h1>404</h1><p>Страница не найдена.</p><Link className="button button-lime" to="/">На главную</Link></div>}
