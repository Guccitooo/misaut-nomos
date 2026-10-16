import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowRight, IconCheck, IconWhatsApp } from '@/components/Icons';
import { BAYENDABA_WHATSAPP, PROJECT_STARTING_PRICE } from '@/lib/bayendaba';

export default function HomeWebOffer() {
  const { t } = useTranslation();
  const price = PROJECT_STARTING_PRICE;
  const message = t('landing.webOffer.whatsappMessage', { price });
  const whatsappUrl = `https://wa.me/${BAYENDABA_WHATSAPP}?text=${encodeURIComponent(message)}`;
  const features = [
    t('landing.webOffer.featurePage'),
    t('landing.webOffer.featureMobile'),
    t('landing.webOffer.featureContact'),
  ];

  return (
    <section className="border-t border-c-border py-8 sm:py-12" aria-labelledby="home-web-offer-title">
      <div className="container-page">
        <div className="rounded-2xl bg-brand-navy p-6 text-white sm:p-9 lg:grid lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-x-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-gold">
              {t('landing.webOffer.eyebrow')}
            </p>
            <h2
              id="home-web-offer-title"
              className="mt-3 font-semibold tracking-tight text-white"
              style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', lineHeight: 1.15 }}
            >
              {t('landing.webOffer.title', { price })}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
              {t('landing.webOffer.body')}
            </p>
            <p className="mt-4 text-lg font-semibold text-brand-gold">
              {t('landing.webOffer.startingPrice', { price })}
            </p>
          </div>

          <div className="mt-6 lg:mt-0">
            <ul className="space-y-2.5 text-sm text-white/90">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col items-start gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn min-h-12 w-full bg-brand-gold px-5 text-brand-navy hover:bg-brand-gold-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold sm:w-auto"
              >
                <IconWhatsApp size={18} aria-hidden="true" />
                {t('landing.webOffer.cta')}
              </a>
              <Link to="/tu-web" className="inline-flex min-h-8 items-center gap-2 text-sm text-white/80 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white">
                {t('landing.webOffer.details')}
                <IconArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <p className="mt-6 border-t border-white/15 pt-4 text-xs leading-relaxed text-white/60 lg:col-span-2">
            {t('landing.webOffer.note')}
          </p>
        </div>
      </div>
    </section>
  );
}
