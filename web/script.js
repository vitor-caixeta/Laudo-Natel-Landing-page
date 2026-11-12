const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
function closeMenu(focus=false){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menu');if(focus)toggle.focus()}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu')});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open'))closeMenu(true)});document.addEventListener('click',e=>{if(!e.target.closest('header'))closeMenu()});nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
const motion=matchMedia('(prefers-reduced-motion: reduce)');
if(!motion.matches&&'IntersectionObserver' in window){document.documentElement.classList.add('motion-ready');const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach((e,i)=>{e.style.setProperty('--delay',`${e.parentElement.classList.contains('grid')?(i%3)*80:0}ms`);io.observe(e)})}
let scheduled=false;function updateScroll(){const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('.scroll-progress').style.transform=`scaleX(${max>0?scrollY/max:0})`;document.querySelector('header').classList.toggle('scrolled',scrollY>30);scheduled=false}addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateScroll)}},{passive:true});updateScroll();
const newsGrid = document.querySelector('#news-grid');
const newsStatus = document.querySelector('#news-status');
let newsBusy = false, lastNewsCheck = 0;
const NEWS_REFRESH_MS = 15 * 60 * 1000;
function coverFor(item) {
  const image = document.createElement('img');
  image.className = 'news-cover';
  image.src = item.image || '/images/noticia-padrao.svg';
  image.alt = ''; // The adjacent title names this story; the cover is decorative.
  image.loading = 'lazy';
  image.decoding = 'async';
  image.width = 640;
  image.height = 400;
  image.addEventListener('error', () => { image.src = '/images/noticia-padrao.svg'; }, { once: true });
  return image;
}
async function news() {
  if (!newsGrid || newsBusy) return;
  newsBusy = true;
  try {
    const response = await fetch('/api/noticias', { cache: 'no-store', signal: AbortSignal.timeout(11000) });
    if (!response.ok) throw Error('feed');
    const data = await response.json();
    if (!data.items?.length) throw Error('empty');
    const cards = data.items.map(item => {
      const card = document.createElement('article');
      card.className = 'news-card';
      const content = document.createElement('div');
      content.className = 'news-content';
      const label = document.createElement('span');
      label.className = 'eyebrow';
      label.textContent = 'STJ · ' + (item.date ? new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Notícia');
      const title = document.createElement('h3');
      title.textContent = item.title;
      const link = document.createElement('a');
      link.className = 'card-link';
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Ler no STJ ↗';
      link.setAttribute('aria-label', 'Ler no STJ: ' + item.title);
      content.append(label, title, link);
      card.append(coverFor(item), content);
      return card;
    });
    newsGrid.replaceChildren(...cards);
    newsStatus.textContent = (data.stale ? 'Última atualização disponível' : 'Atualizado automaticamente') + ' · ' +
      new Date(data.updatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' · Fonte e imagens: STJ';
    lastNewsCheck = Date.now();
  } catch {
    newsStatus.textContent = 'Exibindo as últimas notícias disponíveis. Tentaremos atualizar novamente em alguns minutos. Fonte e imagens: STJ.';
  } finally { newsBusy = false; }
}
if (newsGrid) {
  news();
  setInterval(() => { if (!document.hidden) news(); }, NEWS_REFRESH_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - lastNewsCheck >= NEWS_REFRESH_MS) news();
  });
  addEventListener('online', news);
}
