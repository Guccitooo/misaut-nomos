/**
 * JS minimal du site : en-tête au défilement, menu plein écran, sélecteur de langue,
 * apparitions au défilement, barre d'actions mobile, pastilles de la carte.
 * Tout fonctionne aussi sans JS (contenu visible, liens normaux).
 */

const LANG_KEY = 'aqua-lang';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- En-tête : transparent → plein ---------- */
const header = document.querySelector<HTMLElement>('[data-header]');
const actionBar = document.querySelector<HTMLElement>('[data-actionbar]');
const hero = document.querySelector<HTMLElement>('[data-hero]');

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    header?.setAttribute('data-scrolled', String(y > 24));
    if (actionBar) {
      const threshold = hero ? hero.offsetHeight * 0.55 : 160;
      actionBar.classList.toggle('is-visible', y > threshold);
    }
    ticking = false;
  });
}
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Mémoire de langue + section courante ---------- */
// Section que le visiteur regarde réellement (et non le #hash de l'URL, souvent périmé) : la dernière
// section dont le haut a passé le tiers supérieur de l'écran. Les identifiants sont identiques dans
// toutes les langues (#intro, #menu, #gallery, #visit, #instagram, #cat-…). Sur le hero : aucune.
const spySections = [...document.querySelectorAll<HTMLElement>('main section[id], [data-menu-section]')];
function currentSection(): string {
  const line = window.innerHeight * 0.35;
  let id = '';
  for (const s of spySections) if (s.getBoundingClientRect().top <= line) id = s.id;
  return id;
}

document.addEventListener('click', (e) => {
  const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[data-lang-link]');
  if (!link) return;
  try {
    localStorage.setItem(LANG_KEY, link.dataset.langLink!);
  } catch {
    /* stockage indisponible : on ignore */
  }
  // Ouverture dans un nouvel onglet / fenêtre : comportement natif du lien.
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  const id = currentSection();
  location.href = link.pathname + (id ? `#${id}` : '');
});

/* ---------- Liste des langues (desktop) : Échap + clic extérieur ---------- */
document.querySelectorAll<HTMLDetailsElement>('[data-lang-menu]').forEach((d) => {
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && d.open) {
      d.open = false;
      d.querySelector<HTMLElement>('summary')?.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (d.open && !d.contains(e.target as Node)) d.open = false;
  });
  // Le focus clavier passe à un élément hors de la liste (Tab après la dernière langue) : on la
  // referme. relatedTarget nul (clic sur une zone non focalisable, Safari) : le clic extérieur ci-dessus
  // s'en charge — fermer ici ferait disparaître la liste avant le clic sur une langue.
  d.addEventListener('focusout', (e) => {
    const to = e.relatedTarget as Node | null;
    if (d.open && to && !d.contains(to)) d.open = false;
  });
});

/* ---------- Menu plein écran ---------- */
const menu = document.querySelector<HTMLElement>('[data-mmenu]');
const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
const closeBtn = menu?.querySelector<HTMLButtonElement>('[data-menu-close]');
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trap(e: KeyboardEvent) {
  if (!menu) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeMenu();
    return;
  }
  if (e.key !== 'Tab') return;
  const items = [...menu.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function lockScroll(on: boolean) {
  const root = document.documentElement;
  if (on) {
    const sb = window.innerWidth - root.clientWidth;
    root.style.setProperty('--sb', `${sb}px`);
    document.body.style.paddingInlineEnd = sb ? `${sb}px` : '';
    root.classList.add('is-locked');
  } else {
    root.classList.remove('is-locked');
    document.body.style.paddingInlineEnd = '';
  }
}

function openMenu() {
  if (!menu || !openBtn) return;
  menu.hidden = false;
  menu.classList.remove('is-closing');
  menu.classList.add('is-open');
  openBtn.setAttribute('aria-expanded', 'true');
  lockScroll(true);
  document.addEventListener('keydown', trap);
  (menu.querySelector<HTMLElement>('.mmenu__nav a') ?? closeBtn)?.focus();
}

function closeMenu() {
  if (!menu || !openBtn || menu.hidden) return;
  openBtn.setAttribute('aria-expanded', 'false');
  document.removeEventListener('keydown', trap);
  lockScroll(false);
  const done = () => {
    menu.hidden = true;
    menu.classList.remove('is-open', 'is-closing');
  };
  if (reduceMotion.matches) done();
  else {
    menu.classList.add('is-closing');
    window.setTimeout(done, 260);
  }
  openBtn.focus();
}

openBtn?.addEventListener('click', openMenu);
closeBtn?.addEventListener('click', closeMenu);
menu?.addEventListener('click', (e) => {
  const a = (e.target as Element).closest('a');
  // lien interne vers la page courante (ancre) : on ferme pour laisser défiler
  if (a && a.getAttribute('href')?.startsWith('#')) closeMenu();
});
window.matchMedia('(min-width: 64rem)').addEventListener('change', (m) => {
  if (m.matches) closeMenu();
});

/* ---------- Apparitions au défilement ---------- */
const revealables = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (reduceMotion.matches || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  revealables.forEach((el) => io.observe(el));
}

/* ---------- Vidéo du hero : chargée seulement si le mouvement est autorisé ---------- */
// Le HTML ne contient ni autoplay ni src : en mouvement réduit ou en économie de données, la vidéo
// n'est jamais téléchargée et l'image fixe optimisée reste affichée.
const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
if (video && !reduceMotion.matches && !saveData) {
  video.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach((s) => {
    s.src = s.dataset.src!;
  });
  video.addEventListener('playing', () => video.classList.add('is-playing'), { once: true });
  video.load();
  video.play().catch(() => {
    /* lecture refusée par le navigateur : l'image fixe reste visible */
  });
  reduceMotion.addEventListener('change', (m) => {
    if (m.matches) video.pause();
  });
}

/* ---------- Carte : pastille active selon la catégorie visible ---------- */
const chips = [...document.querySelectorAll<HTMLAnchorElement>('[data-menu-chip]')];
const sections = [...document.querySelectorAll<HTMLElement>('[data-menu-section]')];
if (chips.length && sections.length) {
  let current = '';
  let spyTick = false;
  const spy = () => {
    spyTick = false;
    const line = window.innerHeight * 0.4;
    let id = '';
    for (const s of sections) if (s.getBoundingClientRect().top <= line) id = s.id;
    if (id === current) return;
    current = id;
    chips.forEach((c) => {
      const on = c.hash.slice(1) === id;
      if (!on) {
        c.removeAttribute('aria-current');
        return;
      }
      c.setAttribute('aria-current', 'true');
      // garde la pastille active visible dans la barre horizontale (gère le RTL)
      c.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  };
  spy();
  window.addEventListener(
    'scroll',
    () => {
      if (!spyTick) {
        spyTick = true;
        requestAnimationFrame(spy);
      }
    },
    { passive: true },
  );
}
