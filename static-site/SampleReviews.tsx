import {assetUrl} from './catalog';

const examples = [
  {name: 'Александр М.', photo: 'review-portrait-0.webp', text: 'Заказал футболку со своим дизайном. Конструктор удобный, сразу видно, как будет выглядеть принт. Качество ткани приятно удивило, рисунок получился чётким. Буду заказывать ещё!'},
  {name: 'Мария К.', photo: 'review-portrait-1.webp', text: 'Давно хотела футболку с собственным принтом, но нигде не могла найти подходящий вариант. В AURA WEAR смогла сделать всё сама буквально за несколько минут. Результат полностью оправдал ожидания!'},
  {name: 'Дмитрий С.', photo: 'review-portrait-2.webp', text: 'Понравилась сама идея магазина — не просто выбираешь готовую одежду, а создаёшь что-то своё. Сделал футболку с минималистичным дизайном. Всё просто, понятно и без лишних заморочек. Рекомендую!'},
];

export function SampleReviews({compact=false}: {compact?: boolean}) {
  return <section className="aw-sample-reviews"><div className="aw-sample-head"><div><span className="eyebrow">ПРИМЕРЫ ОТЗЫВОВ · ИЛЛЮСТРАЦИИ</span><h2>{compact ? 'Впечатления' : 'Впечатления о магазине'}<em>.</em></h2></div></div><div className="aw-sample-grid">{examples.map(item => <article key={item.name} className="aw-sample-card"><div className="aw-sample-person"><img src={assetUrl('images/'+item.photo)} alt="Иллюстративный портрет, не фотография автора отзыва" loading="lazy"/><div><strong>{item.name}</strong><span aria-label="Пять звёзд">★★★★★</span></div></div><blockquote>«{item.text}»</blockquote></article>)}</div></section>;
}
