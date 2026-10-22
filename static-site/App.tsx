import {useEffect, useState} from 'react';
import {onAuthStateChanged, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User} from 'firebase/auth';
import {ArrowRight, ArrowUpRight, Box, Heart, Menu, Minus, Monitor, Moon, Palette, Plus, Rotate3D, ShoppingBag, Sparkles, Sun, Trash2, X} from 'lucide-react';
import type {Design, Product} from '@/lib/types';
import {money} from '@/lib/types';
import {useCart} from '@/store/cart';
import {assetUrl, demoTee, demoProducts, loadCatalog} from './catalog';
import {firebaseAuth} from './firebase';
import {deleteDesign, listDesigns, loadDesign} from './local-data';
import {Editor} from './Editor';
import {SizeGuide, Materials, Reviews} from './ContentPages';
import {printCategories, printTemplates, templateImage, templateLayer} from './print-catalog';
import {useDesign} from '@/store/design';

const categories = ['Все', 'Футболки', 'Худи', 'Свитшоты', 'Кружки', 'Чехлы', 'Постеры'];

function useRoute() {
  const read = () => window.location.hash.slice(1) || '/';
  const [route, setRoute] = useState(read);
  useEffect(() => {const update = () => {setRoute(read()); window.scrollTo(0, 0);}; window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update);}, []);
  return route;
}

function go(path: string) {window.location.hash = path;}
function Link({to, children, className = '', ...props}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {to: string}) {return <a href={`#${to}`} className={className} {...props}>{children}</a>;}

type Theme = 'system'|'light'|'dark';
function ThemeChoice() {
  const [choice, setChoice] = useState<Theme>(() => (localStorage.getItem('aura-theme') as Theme) || 'system');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {document.documentElement.dataset.theme = choice === 'system' ? media.matches ? 'dark' : 'light' : choice;};
    apply();
    localStorage.setItem('aura-theme', choice);
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [choice]);
  return <label className="aw-theme-choice" title="Оформление сайта">{choice === 'light' ? <Sun size={18}/> : choice === 'dark' ? <Moon size={18}/> : <Monitor size={18}/>}<select aria-label="Тема сайта" value={choice} onChange={event => setChoice(event.target.value as Theme)}><option value="system">Как в системе</option><option value="light">Светлая тема</option><option value="dark">Тёмная тема</option></select></label>;
}

export default function App() {
  const route = useRoute();
  const [products, setProducts] = useState<Product[]>(demoProducts);
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
    <header className="aw-header"><div className="container aw-header-inner"><Link className="brand" to="/" aria-label="Aura Wear, главная">AURA<small>WEAR<span className="brand-dot">.</span></small></Link>
      <nav className={menuOpen ? 'aw-nav open' : 'aw-nav'} aria-label="Главное меню"><Link to="/catalog">Каталог</Link><Link to="/studio">Конструктор</Link><Link to="/prints">Готовые дизайны</Link><Link to="/reviews">Отзывы</Link><Link to="/designs">Мои проекты</Link><Link className="aw-mobile-login" to="/login">{user ? 'Личный кабинет' : 'Войти'}</Link></nav>
      <div className="aw-header-actions"><ThemeChoice/><Link to="/login" aria-label="Личный кабинет">{user ? user.email?.split('@')[0] : 'Войти'}</Link><Link className="aw-bag" to="/cart" aria-label={`Корзина, ${count} товаров`}><ShoppingBag size={20}/>{count > 0 && <b>{count}</b>}</Link><button className="aw-menu-button" onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}>{menuOpen ? <X/> : <Menu/>}</button></div>
    </div></header>
    <nav className="aw-mobile-quicknav" aria-label="Быстрые ссылки"><Link to="/catalog">Каталог</Link><Link to="/studio">Конструктор</Link><Link to="/reviews">Отзывы</Link></nav>
    <main id="main">
      {path === '/' ? <Home/> :
       path === '/catalog' ? <Catalog products={products} notice={catalogNotice} initialCategory={params.get('category') || 'Все'}/> :
       path === '/product' ? <ProductPage product={products.find(product => product.id === params.get('id')) || demoTee}/> :
       path === '/studio' ? <Editor key={`${selectedProduct.id}:${params.get('id') || ''}`} product={selectedProduct} designId={params.get('id') || undefined} navigate={go}/> :
       path === '/cart' ? <Cart products={products}/> :
       path === '/designs' ? <SavedDesigns products={products}/> :
       path === '/login' ? <Login user={user}/> :
       path === '/prints' ? <Prints selectedId={params.get('design') || undefined}/> :
       path === '/sizes' ? <SizeGuide/> :
       path === '/materials' ? <Materials/> :
       path === '/reviews' ? <Reviews/> :
       path === '/gallery' ? <Reviews gallery/> :
       path === '/about-demo' ? <AboutDemo/> :
       <NotFound/>}
    </main>
    <footer className="aw-footer"><div className="container aw-footer-grid"><div><Link className="brand" to="/">AURA<small>WEAR<span className="brand-dot">.</span></small></Link><p>Твой стиль. Твои правила.</p></div><div><strong>ИССЛЕДУЙ</strong><Link to="/catalog">Каталог</Link><Link to="/studio">Конструктор</Link><Link to="/designs">Мои проекты</Link></div><div><strong>ИНФОРМАЦИЯ</strong><Link to="/sizes">Таблица размеров</Link><Link to="/materials">Материалы и уход</Link><Link to="/reviews">Отзывы</Link><Link to="/gallery">Галерея</Link><Link to="/about-demo">Как работает сайт</Link></div></div><div className="container aw-footer-bottom"><span>© {new Date().getFullYear()} AURA WEAR</span><span>Заказы и оплата пока недоступны</span></div></footer>
  </>;
}

function Home() {return <>
  <section className="aw-hero"><div className="aw-hero-photography"/><div className="container aw-hero-grid"><div className="aw-hero-copy"><span className="eyebrow aw-lime-text">СОЗДАВАЙ <i/> НОСИ <i/> ВДОХНОВЛЯЙ</span><h1>AURA<br/><em>WEAR<span>.</span></em></h1><div className="aw-mobile-hero-art" role="img" aria-label="Молочная футболка Aura Wear на тёмном архитектурном фоне"><span>01 / ТВОЙ ХОЛСТ</span></div><p className="aw-hero-tag">Носи то, что придумал сам.</p><p>Добавь фото, надпись или рисунок. Посмотри результат на футболке в 3D.</p><div className="aw-hero-actions"><Link className="button button-lime" to="/studio">Создать дизайн <ArrowUpRight size={18}/></Link><Link className="button button-outline-light" to="/catalog">Смотреть каталог <ArrowRight size={18}/></Link></div><small>Пока можно создавать и сохранять макеты. Приём заказов откроется позже.</small></div><div className="aw-hero-visual"><span className="aw-art-top">01 / YOUR CANVAS</span><span className="aw-art-bottom">AURA WEAR<br/>STUDIO COLLECTION</span></div></div></section>
  <section className="container aw-home-section"><div className="aw-section-heading"><div><span className="eyebrow">01 / КАТАЛОГ</span><h2>Выбери <em>свою основу.</em></h2></div><p>Вещи для твоих идей. Начни с футболки и посмотри результат в 3D.</p></div><div className="aw-category-grid">{categories.slice(1).map((category, index) => <Link key={category} to={'/catalog?category='+encodeURIComponent(category)} className="aw-category"><img src={assetUrl('images/'+['tee-editorial.webp','hoodie-editorial.webp','sweatshirt-editorial.webp','mug-editorial.webp','case-editorial.webp','poster-editorial.webp'][index])} alt="" loading="lazy"/><small>0{index + 1} / 06</small><strong>{category}</strong><ArrowUpRight size={22}/></Link>)}</div></section>
  <section className="container aw-home-prints"><div className="aw-home-prints-heading"><span className="eyebrow">ГОТОВЫЕ ДИЗАЙНЫ / 06</span><h2>Идея уже есть.<br/><em>Добавь свою.</em></h2><p>Шесть авторских принтов для старта. Каждый можно открыть в конструкторе и дополнить.</p><Link to="/prints">Все принты <ArrowUpRight size={17}/></Link></div><div className="aw-home-prints-grid">{printTemplates.slice(0,3).map(template=><Link to={`/prints?design=${template.id}`} key={template.id} className="aw-home-print"><img src={templateImage(template)} alt={`Принт ${template.title}`}/><span>{template.category} <ArrowUpRight size={16}/></span><strong>{template.title}</strong></Link>)}</div></section>
  <section className="aw-steps"><div className="container"><div className="aw-section-heading"><div><span className="eyebrow aw-lime-text">02 / КАК ЭТО РАБОТАЕТ</span><h2>От идеи до <em>макета.</em></h2></div></div><div className="aw-step-grid"><article><b>01</b><Box/><h3>Выбери основу</h3><p>Начни с футболки и подбери цвет и размер.</p></article><article><b>02</b><Palette/><h3>Создай принт</h3><p>Загрузи фото, добавь текст или нарисуй прямо на изделии.</p></article><article><b>03</b><Rotate3D/><h3>Посмотри в 3D</h3><p>Поверни модель и сохрани свой вариант в браузере.</p></article></div></div></section>
  <section className="container aw-promo"><div><img src={assetUrl('images/objects-editorial.webp')} alt="Кружка, чехол и постер Aura Wear" loading="lazy"/></div><div><span className="eyebrow">AURA STUDIO</span><h2>Сделай<br/>по-своему.</h2><p>Меняй цвет, собирай композицию из слоёв и сразу смотри результат. Начать можно с футболки.</p><Link className="button button-dark" to="/studio">Открыть конструктор <ArrowUpRight size={18}/></Link></div></section>
  <section className="aw-home-feedback container"><div><span className="eyebrow">ЛЮДИ / AURA</span><h2>Твои истории — <em>главное.</em></h2><p>Здесь будут фотографии и отзывы покупателей после первых подтверждённых заказов. Мы не публикуем вымышленные истории.</p></div><figure><img src={assetUrl('images/editorial-model.webp')} alt="Редакционная съёмка Aura Wear: образ с футболкой" loading="lazy"/><figcaption>Редакционная съёмка</figcaption></figure><div><Link to="/gallery">Галерея <ArrowUpRight size={18}/></Link><Link to="/reviews">Отзывы <ArrowUpRight size={18}/></Link></div></section>
  <section className="aw-final-cta"><div className="container"><span className="eyebrow">ТВОЯ АУРА</span><h2>Хватит искать свой стиль.<br/><em>Создай его.</em></h2><Link className="button button-lime" to="/studio">Открыть конструктор <ArrowUpRight size={18}/></Link></div></section>
</>}

function Catalog({products, notice, initialCategory}: {products: Product[]; notice: string; initialCategory: string}) {
  const [category, setCategory] = useState(initialCategory);
  const [text, setText] = useState('');
  const [sort, setSort] = useState('three-d');
  useEffect(() => setCategory(initialCategory), [initialCategory]);
  const filtered = products.filter(product => (category === 'Все' || product.category === category) && `${product.name} ${product.description}`.toLowerCase().includes(text.toLowerCase()));
  filtered.sort((a, b) => sort === 'category' ? a.category.localeCompare(b.category, 'ru') : sort === 'three-d' ? Number(!!b.model) - Number(!!a.model) : a.name.localeCompare(b.name, 'ru'));
  return <div className="container aw-page aw-catalog-page"><div className="aw-page-head"><span className="eyebrow">AURA / КАТАЛОГ</span><h1>Выбери <em>основу.</em></h1><p>Шесть форм для твоего дизайна. Футболку уже можно примерить в 3D; для остальных изделий доступен просмотр.</p></div>
    <div className="aw-catalog-tools"><label>Поиск<input value={text} onChange={event => setText(event.target.value)} placeholder="Название или описание"/></label><label>Категория<select value={category} onChange={event => setCategory(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></label><label>Сортировка<select value={sort} onChange={event => setSort(event.target.value)}><option value="name">По названию</option><option value="category">По категории</option><option value="three-d">Сначала с 3D</option></select></label></div>
    {notice && <p className="aw-info" role="status">{notice}</p>}
    {filtered.length ? <div className="aw-product-grid">{filtered.map(product => <article className="aw-product-card" key={product.id}><Link to={`/product?id=${encodeURIComponent(product.id)}`}><div className="aw-product-image"><img src={product.image} alt={product.name} loading="lazy"/>{product.previewOnly && <span>ОБРАЗЕЦ</span>}</div><div className="aw-product-meta"><h2>{product.name}</h2><span>{product.previewOnly ? product.model ? '3D-модель' : 'Скоро' : money(product.priceRub)}</span></div></Link><p>{product.category}</p><Link to={product.printAreas.length ? `/studio?product=${encodeURIComponent(product.id)}` : `/product?id=${encodeURIComponent(product.id)}`} className="aw-card-action">{product.printAreas.length ? 'Создать дизайн' : 'Подробнее'} <ArrowUpRight size={17}/></Link></article>)}</div> : <div className="aw-empty"><Box size={32}/><h2>Пока пусто</h2><p>В этой категории ещё нет опубликованных товаров.</p><button className="button button-dark" onClick={() => {setCategory('Все'); setText('');}}>Смотреть все</button></div>}
    <p className="aw-fineprint">Это визуальные образцы без подтверждённых цен и характеристик. Продажи пока не открыты.</p>
    <section className="aw-catalog-prints"><div className="aw-catalog-prints-head"><div><span className="eyebrow">AURA / ПРИНТЫ</span><h2>Добавь характер.</h2></div><Link to="/prints">Смотреть все дизайны <ArrowUpRight size={17}/></Link></div><div className="aw-catalog-print-grid">{printTemplates.map(template=><Link key={template.id} to={`/prints?design=${template.id}`}><img src={templateImage(template)} alt={`Авторский принт ${template.title}`} loading="lazy"/><span>{template.category}</span><strong>{template.title}</strong></Link>)}</div></section>
  </div>;
}

function ProductPage({product}: {product: Product}) {return <div className="container aw-page aw-product-detail"><div className="aw-product-detail-image"><img src={product.image} alt={product.name}/></div><div><span className="eyebrow">{product.category} / AURA WEAR</span><h1>{product.name}</h1><p>{product.description}</p><strong>{product.previewOnly ? 'Образец коллекции' : money(product.priceRub)}</strong><div className="aw-product-options"><span>Цвета для просмотра</span><div className="aw-swatches">{product.colors.map(item => <i title={item.name} key={item.name} style={{background: item.hex}}/>)}</div><span>{product.optionLabel || 'Варианты'}</span><div>{product.sizes.join(' · ')}</div></div><div className="aw-detail-links"><Link to="/sizes">Как выбрать размер <ArrowUpRight size={14}/></Link><Link to="/materials">Материалы и уход <ArrowUpRight size={14}/></Link></div>{product.printAreas.length ? <Link className="button button-lime" to={`/studio?product=${encodeURIComponent(product.id)}`}>Открыть конструктор <ArrowUpRight size={17}/></Link> : <p className="aw-info">Конструктор для этого изделия появится после подготовки модели и печатных зон.</p>}<p className="aw-fineprint">Заказы пока не принимаются.</p></div></div>}

function Cart({products}: {products: Product[]}) {
  const cart = useCart();
  const [designs, setDesigns] = useState<Record<string, Design | null>>({});
  useEffect(() => {let active = true; void Promise.all(cart.lines.map(async line => [line.designId, await loadDesign(line.designId)] as const)).then(pairs => {if (active) setDesigns(Object.fromEntries(pairs));}).catch(() => {}); return () => {active = false;};}, [cart.lines]);
  const total = cart.lines.reduce((sum, line) => {const product = products.find(item => item.id === line.productId) || demoTee; const design = designs[line.designId]; const areas = new Set(design?.layers.map(layer => layer.areaId) || []); return sum + line.quantity * (product.priceRub + [...areas].reduce((n, area) => n + (product.printAreas.find(item => item.id === area)?.extraPriceRub || 0), 0));}, 0);
  return <div className="container aw-page"><div className="aw-page-head"><span className="eyebrow">AURA / КОРЗИНА</span><h1>Твои <em>идеи.</em></h1><p>Корзина сохраняется в этом браузере. Оформление и оплата отключены.</p></div>
    {!cart.lines.length ? <div className="aw-empty"><ShoppingBag size={32}/><h2>Корзина пуста</h2><Link className="button button-lime" to="/catalog">В каталог</Link></div> : <div className="aw-cart-layout"><div className="aw-cart-items">{cart.lines.map(line => {const product = products.find(item => item.id === line.productId) || demoTee; const design = designs[line.designId]; return <article className="aw-cart-row" key={line.designId}><img src={product.image} alt={product.name}/><div><span className="eyebrow">ДЕМО-ПРОЕКТ</span><h2>{design?.title || 'Сохранённый дизайн'}</h2><p>{product.name} · {design?.color || '—'} · {design?.size || '—'}</p><Link to={`/studio?product=${encodeURIComponent(product.id)}&id=${line.designId}`}>Редактировать дизайн <ArrowUpRight size={14}/></Link></div><div className="aw-cart-end"><div className="aw-quantity"><button aria-label="Уменьшить количество" onClick={() => cart.quantity(line.designId, line.quantity - 1)}><Minus size={15}/></button><span>{line.quantity}</span><button aria-label="Увеличить количество" onClick={() => cart.quantity(line.designId, line.quantity + 1)}><Plus size={15}/></button></div><button className="aw-icon-btn" aria-label="Удалить из корзины" onClick={() => cart.remove(line.designId)}><Trash2 size={18}/></button></div></article>;})}</div><aside className="aw-cart-summary"><span className="eyebrow">ИТОГО / ДЕМО</span><h2>Макеты готовы.</h2><div><span>Условная сумма</span><strong>{cart.lines.every(line => (products.find(item => item.id === line.productId) || demoTee).previewOnly) ? '—' : money(total)}</strong></div><p>Это пример расчёта без серверной проверки, доставки и оплаты. Заказ не отправляется продавцу.</p><button className="button button-dark full" disabled>Оформление недоступно</button><Link to="/about-demo">Как появятся настоящие заказы <ArrowUpRight size={14}/></Link></aside></div>}
  </div>;
}

function SavedDesigns({products}: {products: Product[]}) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {void listDesigns().then(items => Promise.all(items.map(item => loadDesign(item.id)))).then(items => setDesigns(items.filter((item): item is Design => !!item))).catch(error => setError((error as Error).message));}, []);
  async function remove(id: string) {if (!window.confirm('Удалить сохранённый проект?')) return; try {await deleteDesign(id); useCart.getState().remove(id); setDesigns(items => items.filter(item => item.id !== id));} catch (error) {setError((error as Error).message);}}
  return <div className="container aw-page"><div className="aw-page-head"><span className="eyebrow">AURA / ЛОКАЛЬНЫЕ ПРОЕКТЫ</span><h1>Мои <em>дизайны.</em></h1><p>Проекты и исходные изображения хранятся в этом браузере. При очистке данных сайта они исчезнут.</p></div>{error && <p role="alert" className="aw-warning">{error}</p>}
    {designs.length ? <div className="aw-saved-grid">{designs.map(design => {const product = products.find(item => item.id === design.productId) || demoTee; const firstImage = design.previewUrl || design.layers.find(layer => layer.image?.url)?.image?.url; return <article key={design.id}><div className="aw-saved-image"><img src={firstImage || product.image} alt={design.title}/></div><div><span className="eyebrow">{product.name}</span><h2>{design.title}</h2><p>{design.color} · {design.size} · {new Date(design.updatedAt).toLocaleDateString('ru-RU')}</p><div><Link className="button button-dark" to={`/studio?product=${encodeURIComponent(product.id)}&id=${design.id}`}>Редактировать</Link><button className="aw-icon-btn" aria-label={`Удалить ${design.title}`} onClick={() => void remove(design.id)}><Trash2 size={18}/></button></div></div></article>;})}</div> : <div className="aw-empty"><Heart size={32}/><h2>Пока нет проектов</h2><Link className="button button-lime" to="/studio">Создать дизайн</Link></div>}
  </div>;
}

function Login({user}: {user: User | null}) {
  const [mode, setMode] = useState<'login'|'register'|'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {event.preventDefault(); setBusy(true); setMessage(''); try {if (mode === 'register') {const account = await createUserWithEmailAndPassword(firebaseAuth, email, password); await sendEmailVerification(account.user); setMessage('Аккаунт создан. Письмо для подтверждения email отправлено.');} else if (mode === 'reset') {await sendPasswordResetEmail(firebaseAuth, email); setMessage('Если адрес зарегистрирован, письмо для восстановления отправлено.');} else {await signInWithEmailAndPassword(firebaseAuth, email, password); setMessage('Вход выполнен. Локальные проекты остаются только в этом браузере.');}} catch (error) {const code = (error as {code?: string}).code || 'auth/unknown'; const readable: Record<string,string> = {'auth/invalid-credential':'Неверный адрес или пароль.','auth/email-already-in-use':'Этот адрес уже зарегистрирован.','auth/too-many-requests':'Слишком много попыток. Попробуйте позже.','auth/network-request-failed':'Не удалось подключиться. Проверьте интернет.','auth/invalid-email':'Проверьте адрес электронной почты.'}; setMessage(readable[code] || 'Не удалось выполнить действие. Попробуйте позже.');} finally {setBusy(false);}}
  return <div className="container aw-page aw-auth"><div><span className="eyebrow">AURA / ЛИЧНЫЙ КАБИНЕТ</span><h1>Твой аккаунт<span>.</span></h1><p>Здесь можно войти в аккаунт. Проекты сохраняются на этом устройстве.</p><Sparkles size={72} strokeWidth={.8}/></div><section>{user ? <><h2>Вы вошли</h2><p>{user.email}</p><p>Email {user.emailVerified ? 'подтверждён' : 'не подтверждён'}.</p>{!user.emailVerified && <button className="button button-outline" onClick={() => void sendEmailVerification(user).then(() => setMessage('Письмо отправлено.')).catch(error => setMessage((error as Error).message))}>Отправить письмо повторно</button>}<button className="button button-dark" onClick={() => void signOut(firebaseAuth)}>Выйти</button></> : <><h2>{mode === 'login' ? 'Войти' : mode === 'register' ? 'Создать аккаунт' : 'Восстановить пароль'}</h2><form onSubmit={event => void submit(event)}><label>Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email"/></label>{mode !== 'reset' && <label>Пароль<input required type="password" minLength={6} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'}/></label>}<button className="button button-lime full" disabled={busy}>{mode === 'login' ? 'Войти' : mode === 'register' ? 'Зарегистрироваться' : 'Отправить письмо'}</button></form><div className="aw-auth-switch"><button onClick={() => setMode('login')}>Вход</button><button onClick={() => setMode('register')}>Регистрация</button><button onClick={() => setMode('reset')}>Забыли пароль?</button></div></>}{message && <p role="status" className="aw-info">{message}</p>}</section></div>;
}

function Prints({selectedId}: {selectedId?: string}) {
  const [category, setCategory] = useState('Все');
  useEffect(() => {
    if (!selectedId || !printTemplates.some(item => item.id === selectedId)) return;
    setCategory('Все');
    const timer = window.setTimeout(() => document.getElementById(`print-${selectedId}`)?.scrollIntoView({block:'center', behavior:'smooth'}), 80);
    return () => window.clearTimeout(timer);
  }, [selectedId]);
  const visible = category === 'Все' ? printTemplates : printTemplates.filter(item => item.category === category);
  function openTemplate(item: typeof printTemplates[number]) {
    const state = useDesign.getState();
    state.setProduct(demoTee.id, demoTee.colors[0].name, 'M');
    state.setOption('title', item.title);
    state.addLayer(templateLayer(item));
    go('/studio?product='+demoTee.id);
  }
  return <div className="container aw-page aw-prints"><div className="aw-page-head"><span className="eyebrow">AURA / КОЛЛЕКЦИЯ</span><h1>Готовые <em>дизайны.</em></h1><p>Оригинальная графика Aura Wear. Выбирай тему, а затем меняй её в конструкторе под себя.</p></div><div className="aw-print-filters" role="group" aria-label="Категория принтов">{printCategories.map(item=><button key={item} className={category===item?'active':''} onClick={()=>setCategory(item)}>{item}</button>)}</div><div className="aw-print-grid">{visible.map(item=><article key={item.id} id={`print-${item.id}`} className={selectedId===item.id?'aw-print-selected':''}><img src={templateImage(item)} alt={'Принт '+item.title} loading="lazy"/><div><span className="eyebrow">{item.category}</span><h2>{item.title}</h2><p>{item.subtitle}</p><button className="button button-dark" onClick={()=>openTemplate(item)}>На футболку <ArrowUpRight size={16}/></button></div></article>)}</div><p className="aw-fineprint">Это цифровые эскизы для предпросмотра. Продажа изделий пока не открыта.</p></div>;
}
function AboutDemo() {return <div className="container aw-page aw-about"><div className="aw-page-head"><span className="eyebrow">AURA / ЧЕСТНЫЙ РЕЖИМ</span><h1>Что работает <em>сейчас.</em></h1></div><div className="aw-about-grid"><article><Rotate3D/><h2>Работает</h2><p>Каталог, 3D-модель футболки, загрузка фото, надписи, слои, цвета, размеры, сохранение проектов и корзина в этом браузере. Новые товары появятся здесь после публикации каталога.</p></article><article><ShoppingBag/><h2>Пока демонстрация</h2><p>Условная сумма в корзине не является ценой продажи. Сайт не принимает платежи и не отправляет заказы. Загруженные изображения остаются на вашем устройстве.</p></article><article><Box/><h2>Для запуска продаж</h2><p>Потребуются реальные товары и сведения о продавце, документы, защищённый сервер, хранение файлов и платёжный сервис. Пошаговая инструкция находится в README репозитория.</p></article></div><Link className="button button-lime" to="/studio">Попробовать конструктор <ArrowUpRight size={17}/></Link></div>}
function NotFound() {return <div className="container aw-page aw-empty"><h1>404</h1><p>Страница не найдена.</p><Link className="button button-lime" to="/">На главную</Link></div>}
