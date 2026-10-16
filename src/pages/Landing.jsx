// Portada: buscador de profesionales y oferta de web de BayenDaba.

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconArrowRight,
  IconVerified,
  IconStarOutline,
  IconWhatsApp,
} from '@/components/Icons';
import SEOHead from '@/components/seo/SEOHead';
import HeroSearch, { useServiceCategories } from '@/components/home/HeroSearch';
import { HeroMockupDesktop, HeroMockupMobile } from '@/components/home/HeroMockup';
import HomeWebOffer from '@/components/home/HomeWebOffer';

// Oficios del carril del hero, por orden de intención de búsqueda. Son slugs:
// si uno no está en la base de datos no se pinta, y el carril se completa con
// las categorías que haya, hasta ocho. Así la portada nunca enseña un chip que
// lleve a una categoría vacía.
const HERO_CHIP_SLUGS = [
  'electricista',
  'fontanero',
  'pintor',
  'albanil-reformas',
  'cerrajero',
  'carpintero',
  'jardinero',
  'autonomo-limpieza',
];
const HERO_CHIP_COUNT = 8;

function HeroChips() {
  const { categories } = useServiceCategories();
  if (!categories.length) return null;

  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const picked = HERO_CHIP_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean);
  const rest = categories.filter((c) => !picked.includes(c));
  const chips = [...picked, ...rest].slice(0, HERO_CHIP_COUNT);

  return (
    <div className="scroll-x -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible pb-1">
      {chips.map((c) => (
        <Link key={c.slug} to={`/categoria/${c.slug}`} className="chip">
          {c.name}
        </Link>
      ))}
    </div>
  );
}

export default function Landing() {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead title={t('landing.seo.title')} description={t('landing.seo.description')} />

      <main className="bg-canvas text-ink">
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="pt-6 pb-8 sm:pt-16 sm:pb-8">
          <div className="container-page">
            <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10 lg:gap-8 items-center">
              {/* Izquierda — texto, buscador, confianza, oficios */}
              <div className="min-w-0">
                <h1
                  className="hero-enter text-brand-navy font-bold leading-[1.05]"
                  style={{ fontSize: 'clamp(2rem, 5.5vw, 3.75rem)', letterSpacing: '-0.02em' }}
                >
                  {t('landing.hero.headlineA')}{' '}
                  <span className="text-brand-gold-deep">{t('landing.hero.headlineB')}</span>
                </h1>

                <p
                  className="hero-enter hero-enter-delay-1 mt-3 sm:mt-4 text-c-muted"
                  style={{ fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', lineHeight: 1.5 }}
                >
                  {t('landing.hero.pitch')}
                </p>

                <div className="hero-enter hero-enter-delay-1 mt-5 sm:mt-6">
                  <HeroSearch />
                </div>

                {/* Salida secundaria: ver el listado entero sin elegir nada. */}
                <div className="hero-enter hero-enter-delay-2 mt-3">
                  <Link
                    to="/buscar"
                    className="group inline-flex items-center gap-2 text-sm text-c-muted hover:text-ink transition-colors"
                  >
                    <span>{t('landing.hero.browseAllHint')}</span>
                    <IconArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>

                {/* Tres señales de confianza, sin cifras inventadas. */}
                <ul className="hero-enter hero-enter-delay-2 mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-c-muted">
                  <li className="inline-flex items-center gap-1.5">
                    <IconVerified className="w-3.5 h-3.5 text-success" />
                    <span>{t('landing.hero.trustVerified')}</span>
                  </li>
                  <li className="inline-flex items-center gap-1.5">
                    <IconStarOutline className="w-3.5 h-3.5 text-star" />
                    <span>{t('landing.trust.reviews.title')}</span>
                  </li>
                  <li className="inline-flex items-center gap-1.5">
                    <IconWhatsApp size={14} className="text-whatsapp" />
                    <span>{t('landing.hero.trustWhatsapp')}</span>
                  </li>
                </ul>

                <div className="hero-enter hero-enter-delay-3 mt-5">
                  <HeroChips />
                </div>

                {/* Móvil: la maqueta, compacta, después de los chips. */}
                <div className="lg:hidden mt-6">
                  <HeroMockupMobile />
                </div>
              </div>

              {/* Derecha — maqueta de móvil */}
              <div className="hidden lg:block relative">
                <HeroMockupDesktop />
              </div>
            </div>
          </div>
        </section>

        <HomeWebOffer />
      </main>
    </>
  );
}
