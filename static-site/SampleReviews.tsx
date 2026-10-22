import {assetUrl} from './catalog';

const examples = [
  {name: 'Александр М.', photo: 'review-portrait-0.webp', text: 'Заказал футболку со своим дизайном. Конструктор удобный, сразу видно, как будет выглядеть принт. Качество ткани приятно удивило, рисунок получился чётким. Буду заказывать ещё!'},
  {name: 'Мария К.', photo: 'review-portrait-1.webp', text: 'Давно хотела футболку с собственным принтом, но нигде не могла найти подходящий вариант. В AURA WEAR смогла сделать всё сама буквально за несколько минут. Результат полностью оправдал ожидания!'},
  {name: 'Дмитрий С.', photo: 'review-portrait-2.webp', text: 'Понравилась сама идея магазина — не просто выбираешь готовую одежду, а создаёшь что-то своё. Сделал футболку с минималистичным дизайном. Всё просто, понятно и без лишних заморочек. Рекомендую!'},
];

type PublishedReview = {id: string; rating: number; text: string; displayName?: string; productName?: string};

export function SampleReviews({compact=false, showHeading=true, verified=[]}: {compact?: boolean; showHeading?: boolean; verified?: PublishedReview[]}) {
  return <section className={`aw-sample-reviews${showHeading ? '' : ' aw-no-heading'}`} aria-label="Отзывы покупателей">
    {showHeading && <div className="aw-sample-head"><div><span className="eyebrow">{compact ? 'AURA / ОТЗЫВЫ' : 'ОТЗЫВЫ О МАГАЗИНЕ'}</span><h2>Отзывы покупателей<em>.</em></h2></div></div>}
    <div className="aw-sample-grid">
      {verified.map(item => <article key={item.id} className="aw-review-card"><div className="aw-rating" aria-label={'Оценка '+item.rating+' из 5'}>{'★'.repeat(item.rating)}{'☆'.repeat(5-item.rating)}</div><p>«{item.text}»</p><small>{item.displayName||'Покупатель'}{item.productName?' · '+item.productName:''}</small></article>)}
      {examples.map(item => <article key={item.name} className="aw-sample-card"><div className="aw-sample-person"><img src={assetUrl('images/'+item.photo)} alt="Иллюстративный портрет, не фотография автора отзыва" loading="lazy"/><div><strong>{item.name}</strong><span aria-label="Пять звёзд">★★★★★</span></div></div><blockquote>«{item.text}»</blockquote><small>Портрет — иллюстрация</small></article>)}
    </div>
  </section>;
}
