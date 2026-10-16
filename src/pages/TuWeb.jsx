import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowRight, IconCalendar, IconCheck, IconDashboard, IconGlobe, IconPhone, IconSparkles, IconWhatsApp, IconZap } from '@/components/Icons';
import SEOHead from '@/components/seo/SEOHead';
import { useAppData } from '@/lib/AppContext';
import { useHydrationReady } from '@/lib/publicPageData';
import { buildWebRequest, offerSource, PROJECT_STARTING_PRICE, PROJECT_TYPES } from '@/lib/bayendaba';
import './TuWeb.css';

const EXAMPLES = ['web', 'apps', 'software'];
const SERVICES = [
  { key: 'web', Icon: IconGlobe },
  { key: 'apps', Icon: IconPhone },
  { key: 'software', Icon: IconDashboard },
  { key: 'bookings', Icon: IconCalendar },
  { key: 'automation', Icon: IconZap },
  { key: 'ai', Icon: IconSparkles },
];

function ProjectPreview({ example, t }) {
  return (
    <div className={`tw-preview tw-preview--${example}`}>
      <div className="tw-browser" aria-hidden="true"><span /><span /><span /><div>{t(`tuWeb.examples.${example}.address`)}</div></div>
      <div className="tw-preview-body">
        <div className="tw-preview-nav"><strong>{t(`tuWeb.examples.${example}.name`)}</strong><IconGlobe className="w-4 h-4" aria-hidden="true" /></div>
        <p className="tw-preview-kicker">{t(`tuWeb.examples.${example}.tag`)}</p>
        <p className="tw-preview-heading">{t(`tuWeb.examples.${example}.title`)}</p>
        <p className="tw-preview-copy">{t(`tuWeb.examples.${example}.body`)}</p>
        {example === 'web' ? <>
          <span className="tw-preview-button">{t('tuWeb.examples.web.action')} <IconArrowRight className="w-3 h-3" aria-hidden="true" /></span>
          <div className="tw-preview-art" aria-hidden="true"><div /><div /><div /></div>
        </> : <div className="tw-preview-tools">
          {['first', 'second', 'third'].map((key, index) => <div key={key}><span className="tw-preview-tool-icon" aria-hidden="true">{example === 'apps' ? <IconCalendar size={14} /> : `0${index + 1}`}</span><span>{t(`tuWeb.examples.${example}.${key}`)}</span><IconArrowRight size={13} aria-hidden="true" /></div>)}
        </div>}
        <div className="tw-preview-bottom"><span>{t(`tuWeb.examples.${example}.footer`)}</span><span>BayenDaba</span></div>
      </div>
    </div>
  );
}

export default function TuWeb() {
  const { t, i18n } = useTranslation();
  const { profile } = useAppData();
  const [params] = useSearchParams();
  const hydrationReady = useHydrationReady();
  const source = offerSource(hydrationReady ? params.get('origen') : null);
  const [example, setExample] = useState('web');
  const [business, setBusiness] = useState('');
  const [activity, setActivity] = useState('');
  const [projectType, setProjectType] = useState('');
  const [details, setDetails] = useState('');
  const [prepared, setPrepared] = useState(false);
  const lang = i18n.resolvedLanguage || i18n.language || 'es';
  const price = new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(PROJECT_STARTING_PRICE);
  const request = buildWebRequest({ business, activity, details, projectType, source, language: lang });
  const directRequest = buildWebRequest({ source, language: lang });
  const update = setter => event => { setter(event.target.value); setPrepared(false); };
  const prepareRequest = event => { event.preventDefault(); setPrepared(true); };

  return (
    <main className="tu-web">
      <SEOHead title={t('tuWeb.seo.title')} description={t('tuWeb.seo.description')} author="BayenDaba" />
      <section className="tw-hero">
        <div className="container-page tw-hero-grid">
          <div>
            <p className="tw-eyebrow">{t('tuWeb.hero.eyebrow')}</p>
            <h1>{t('tuWeb.hero.title')} <span>{t('tuWeb.hero.highlight')}</span></h1>
            <p className="tw-lead">{t('tuWeb.hero.body')}</p>
            <div className="tw-starting-price"><span>{t('tuWeb.hero.from')}</span><strong>{price}</strong><span>{t('tuWeb.hero.indicative')}</span></div>
            <p className="tw-price-note">{t('tuWeb.hero.priceNote')}</p>
            <div className="tw-actions">
              <a className="tw-button tw-button-gold" href={directRequest.whatsapp} target="_blank" rel="noopener noreferrer"><IconWhatsApp size={18} aria-hidden="true" />{t('tuWeb.hero.cta')}</a>
              <a className="tw-text-link" href="#servicios">{t('tuWeb.hero.explore')}</a>
            </div>
            <p className="tw-provider">{t('tuWeb.hero.provider')} <a href="https://bayendaba.com/es?utm_source=misautonomos&utm_medium=referral&utm_campaign=tu_web" target="_blank" rel="noopener noreferrer">BayenDaba ↗</a></p>
          </div>
          <div className="tw-demo">
            <div className="tw-design-tabs" role="group" aria-label={t('tuWeb.examples.label')}>
              {EXAMPLES.map(value => <button key={value} type="button" aria-pressed={example === value} onClick={() => setExample(value)}>{t(`tuWeb.examples.${value}.tab`)}</button>)}
            </div>
            <ProjectPreview example={example} t={t} />
            <p className="tw-demo-caption">{t('tuWeb.examples.caption')}</p>
          </div>
        </div>
      </section>

      <div className="tw-reassurance"><div className="container-page">{['custom', 'complete', 'direct'].map(key => <span key={key}><IconCheck className="w-4 h-4" aria-hidden="true" />{t(`tuWeb.trust.${key}`)}</span>)}</div></div>

      <section id="servicios" className="container-page tw-section">
        <div className="tw-section-heading"><p className="tw-eyebrow">{t('tuWeb.services.eyebrow')}</p><h2>{t('tuWeb.services.title')}</h2><p>{t('tuWeb.services.body')}</p></div>
        <div className="tw-services">
          {SERVICES.map(({ key, Icon }) => <article className="tw-service" key={key}><span className="tw-service-icon"><Icon size={22} aria-hidden="true" /></span><h3>{t(`tuWeb.services.${key}.title`)}</h3><p>{t(`tuWeb.services.${key}.body`)}</p></article>)}
        </div>
        <div className="tw-full-project"><div><p className="tw-eyebrow">{t('tuWeb.complete.eyebrow')}</p><h3>{t('tuWeb.complete.title')}</h3><p>{t('tuWeb.complete.body')}</p></div><a className="tw-text-link" href="#solicitar">{t('tuWeb.complete.cta')} <IconArrowRight size={16} aria-hidden="true" /></a></div>
      </section>

      <section className="tw-process"><div className="container-page tw-section"><div className="tw-section-heading"><p className="tw-eyebrow">{t('tuWeb.process.eyebrow')}</p><h2>{t('tuWeb.process.title')}</h2></div><ol>{['brief', 'design', 'launch'].map((key, index) => <li key={key}><span className="tw-step-number">0{index + 1}</span><h3>{t(`tuWeb.process.${key}.title`)}</h3><p>{t(`tuWeb.process.${key}.body`)}</p></li>)}</ol></div></section>

      <section id="solicitar" className="container-page tw-section tw-contact-grid">
        <div className="tw-section-heading">
          <p className="tw-eyebrow">{t('tuWeb.form.eyebrow')}</p><h2>{t('tuWeb.form.title')}</h2><p>{t('tuWeb.form.body')}</p>
          <a className="tw-button tw-button-gold tw-contact-whatsapp" href={directRequest.whatsapp} target="_blank" rel="noopener noreferrer"><IconWhatsApp size={18} aria-hidden="true" />{t('tuWeb.form.direct')}</a>
          <a className="tw-direct-email" href={directRequest.email}>{t('tuWeb.form.email')}</a>
          <p className="tw-contact-note">{t('tuWeb.form.noCommitment')}</p>
          <Link to="/para-autonomos" className="tw-directory-link">{t('tuWeb.form.freeDirectory')} <IconArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
        </div>
        <form className="tw-form" onSubmit={prepareRequest}>
          <h3>{t('tuWeb.form.formTitle')}</h3><p className="tw-form-intro">{t('tuWeb.form.optional')}</p>
          <label htmlFor="web-business">{t('tuWeb.form.business')}</label>
          <input id="web-business" name="business" autoComplete="organization" maxLength={100} value={business} onChange={update(setBusiness)} placeholder={t('tuWeb.form.businessPlaceholder')} />
          {profile?.business_name ? <button type="button" className="tw-prefill" onClick={() => { setBusiness(profile.business_name.slice(0, 100)); setPrepared(false); }}>{t('tuWeb.form.useProfile')}</button> : null}
          <label htmlFor="web-activity">{t('tuWeb.form.activity')}</label>
          <input id="web-activity" name="activity" maxLength={100} value={activity} onChange={update(setActivity)} placeholder={t('tuWeb.form.activityPlaceholder')} />
          <label htmlFor="web-project-type">{t('tuWeb.form.projectType')}</label>
          <select id="web-project-type" name="projectType" value={projectType} onChange={update(setProjectType)}><option value="">{t('tuWeb.form.projectPlaceholder')}</option>{PROJECT_TYPES.map(key => <option key={key} value={key}>{t(`tuWeb.form.types.${key}`)}</option>)}</select>
          <label htmlFor="web-details">{t('tuWeb.form.details')}</label>
          <textarea id="web-details" name="details" rows={4} maxLength={3000} value={details} onChange={update(setDetails)} placeholder={t('tuWeb.form.detailsPlaceholder')} />
          <p className="tw-form-note">{t('tuWeb.form.privacy')}</p>
          <button type="submit" className="tw-button tw-button-navy">{t('tuWeb.form.prepare')} <IconArrowRight className="w-4 h-4" aria-hidden="true" /></button>
          <div aria-live="polite" aria-atomic="true">
            {prepared ? <div className="tw-request"><h3>{t('tuWeb.form.ready')}</h3><p>{t('tuWeb.form.review')}</p><details><summary>{t('tuWeb.form.preview')}</summary><pre>{request.text}</pre></details><a className="tw-button tw-button-gold" href={request.whatsapp} target="_blank" rel="noopener noreferrer"><IconWhatsApp size={18} aria-hidden="true" />{t('tuWeb.form.whatsapp')}</a><a className="tw-email" href={request.email}>{t('tuWeb.form.email')}</a></div> : null}
          </div>
        </form>
      </section>

      <section className="tw-faq"><div className="container-page tw-section"><h2>{t('tuWeb.faq.title')}</h2><div>{['price', 'complete', 'start'].map(key => <details key={key}><summary>{t(`tuWeb.faq.${key}.q`)}</summary><p>{t(`tuWeb.faq.${key}.a`)}</p></details>)}</div></div></section>
    </main>
  );
}
