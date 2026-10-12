import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowRight, IconGlobe } from '@/components/Icons';
import { offerPath } from '@/lib/bayendaba';

export default function BayenDabaOffer({ source = 'direct' }) {
  const { t } = useTranslation();
  return (
    <aside aria-label={t('tuWeb.card.label')} className="rounded-2xl border border-c-border bg-surface p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <span className="inline-flex w-11 h-11 shrink-0 items-center justify-center rounded-xl bg-[#00255C]/[0.07] text-[#00255C]" aria-hidden="true">
          <IconGlobe className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-c-muted">{t('tuWeb.card.eyebrow')}</p>
          <h2 className="mt-1 text-xl font-bold text-[#00255C]">{t('tuWeb.card.title')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-c-muted">{t('tuWeb.card.body')}</p>
          <p className="mt-2 text-xs text-c-muted">{t('tuWeb.card.note')}</p>
        </div>
        <Link to={offerPath(source)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#F5C13D] px-4 py-3 text-sm font-semibold text-[#00255C] hover:bg-[#eab52e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00255C]">
          {t('tuWeb.card.cta')} <IconArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
