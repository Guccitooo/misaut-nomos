import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowRight, IconCheck, IconGlobe, IconMessageSquare } from '@/components/Icons';
import SEOHead from '@/components/seo/SEOHead';
import { useAppData } from '@/lib/AppContext';
import { buildWebRequest, offerSource, WEB_PLANS, MAINTENANCE_PRICE } from '@/lib/bayendaba';
import './TuWeb.css';

const DESIGNS = ['services', 'craft', 'studio'];

function DesignPreview({ design, t }) {
  return (
    <div className={`tw-preview tw-preview--${design}`}>
      <div className="tw-browser" aria-hidden="true"><span /><span /><span /><div>tunegocio.es</div></div>
      <div className="tw-preview-body">
        <div className="tw-preview-nav"><strong>{t(`tuWeb.examples.${design}.name`)}</strong><IconGlobe className="w-4 h-4" aria-hidden="true" /></div>
        <p className="tw-preview-kicker">{t(`tuWeb.examples.${design}.tag`)}</p>
        <p className="tw-preview-heading">{t(`tuWeb.examples.${design}.title`)}</p>
        <p className="tw-preview-copy">{t(`tuWeb.examples.${design}.body`)}</p>
        <span className="tw-preview-button">{t('tuWeb.examples.contact')} <IconArrowRight className="w-3 h-3" aria-hidden="true" /></span>
        <div className="tw-preview-art" aria-hidden="true"><div /><div /><div /></div>
        <div className="tw-preview-bottom"><span>{t('tuWeb.examples.work')}</span><span>{t('tuWeb.examples.about')}</span><span>{t('tuWeb.examples.contact')}</span></div>
      </div>
    </div>
  );
}

export default function TuWeb() {
  const { t, i18n } = useTranslation();
  const { profile } = useAppData();
  const [params] = useSearchParams();
  const source = offerSource(params.get('origen'));
  const [design, setDesign] = useState('services');
  const [plan, setPlan] = useState('essential');
  const [maintenance, setMaintenance] = useState(false);
  const [business, setBusiness] = useState('');
  const [activity, setActivity] = useState('');
  const [details, setDetails] = useState('');
  const [prepared, setPrepared] = useState(false);
  const lang = i18n.resolvedLanguage || i18n.language || 'es';
  const money = value => new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  const request = buildWebRequest({ business, activity, details, plan, maintenance, source, language: lang });

  const update = setter => event => { setter(event.target.value); setPrepared(false); };
  const choosePlan = value => { setPlan(value); setPrepared(false); };
  const prepareRequest = event => {
    event.preventDefault();
    if (!business.trim() || !activity.trim()) return;
    setPrepared(true);
  };

  return (
    <main className="tu-web">
      <SEOHead title={t('tuWeb.seo.title')} description={t('tuWeb.seo.description')} author="BayenDaba" />
      <section className="tw-hero">
        <div className="container-page tw-hero-grid">
          <div>
            <p className="tw-eyebrow">{t('tuWeb.hero.eyebrow')}</p>
            <h1>{t('tuWeb.hero.title')} <span>{t('tuWeb.hero.highlight')}</span></h1>
            <p className="tw-lead">{t('tuWeb.hero.body')}</p>
            <div className="tw-starting-price"><span>{t('tuWeb.hero.from')}</span><strong>{money(WEB_PLANS.essential)}</strong><span>{t('tuWeb.hero.once')}</span></div>
            <p className="tw-price-note">{t('tuWeb.hero.priceNote')}</p>
            <div className="tw-actions">
              <a className="tw-button tw-button-gold" href="#planes">{t('tuWeb.hero.cta')} <IconArrowRight className="w-4 h-4" aria-hidden="true" /></a>
              <a className="tw-text-link" href="#solicitar">{t('tuWeb.hero.contact')}</a>
            </div>
            <p className="tw-provider">{t('tuWeb.hero.provider')} <a href="https://bayendaba.com/es?utm_source=misautonomos&utm_medium=referral&utm_campaign=tu_web" target="_blank" rel="noopener noreferrer">BayenDaba ↗</a></p>
          </div>
          <div className="tw-demo">
            <div className="tw-design-tabs" role="group" aria-label={t('tuWeb.examples.label')}>
              {DESIGNS.map(value => <button key={value} type="button" aria-pressed={design === value} onClick={() => setDesign(value)}>{t(`tuWeb.examples.${value}.tab`)}</button>)}
            </div>
            <DesignPreview design={design} t={t} />
            <p className="tw-demo-caption">{t('tuWeb.examples.caption')}</p>
          </div>
        </div>
      </section>

      <div className="tw-reassurance"><div className="container-page">{['mobile', 'ownership', 'direct'].map(key => <span key={key}><IconCheck className="w-4 h-4" aria-hidden="true" />{t(`tuWeb.trust.${key}`)}</span>)}</div></div>

      <section id="planes" className="container-page tw-section">
        <div className="tw-section-heading"><p className="tw-eyebrow">{t('tuWeb.plans.eyebrow')}</p><h2>{t('tuWeb.plans.title')}</h2><p>{t('tuWeb.plans.body')}</p></div>
        <div className="tw-plans">
          {Object.entries(WEB_PLANS).map(([key, price]) => (
            <article key={key} className={`tw-plan ${key === 'essential' ? 'tw-plan-featured' : ''}`}>
              <p className="tw-plan-label">{t(`tuWeb.plans.${key}.label`)}</p>
              <h3>{t(`tuWeb.plans.${key}.title`)}</h3>
              <p className="tw-plan-description">{t(`tuWeb.plans.${key}.body`)}</p>
              <p className="tw-plan-price"><strong>{money(price)}</strong><span>{t('tuWeb.hero.once')}</span></p>
              <ul>{t(`tuWeb.plans.${key}.features`, { returnObjects: true }).map(item => <li key={item}><IconCheck className="w-4 h-4 shrink-0" aria-hidden="true" />{item}</li>)}</ul>
              <a href="#solicitar" className={`tw-button ${key === 'essential' ? 'tw-button-gold' : 'tw-button-outline'}`} onClick={() => choosePlan(key)}>{t(`tuWeb.plans.${key}.cta`)}<IconArrowRight className="w-4 h-4" aria-hidden="true" /></a>
            </article>
          ))}
        </div>
        <div className="tw-maintenance"><div><p className="tw-eyebrow">{t('tuWeb.maintenance.eyebrow')}</p><h3>{t('tuWeb.maintenance.title')}</h3><p>{t('tuWeb.maintenance.body')}</p></div><p className="tw-maintenance-price"><strong>{money(MAINTENANCE_PRICE)}</strong><span>{t('tuWeb.maintenance.month')}</span></p></div>
        <div className="tw-conditions"><h3>{t('tuWeb.conditions.title')}</h3><ul>{t('tuWeb.conditions.items', { returnObjects: true }).map(item => <li key={item}>{item}</li>)}</ul></div>
      </section>

      <section className="tw-process"><div className="container-page tw-section"><div className="tw-section-heading"><p className="tw-eyebrow">{t('tuWeb.process.eyebrow')}</p><h2>{t('tuWeb.process.title')}</h2></div><ol>{['brief', 'design', 'publish'].map((key, index) => <li key={key}><span className="tw-step-number">0{index + 1}</span><h3>{t(`tuWeb.process.${key}.title`)}</h3><p>{t(`tuWeb.process.${key}.body`)}</p></li>)}</ol></div></section>

      <section id="solicitar" className="container-page tw-section tw-contact-grid">
        <div className="tw-section-heading"><p className="tw-eyebrow">{t('tuWeb.form.eyebrow')}</p><h2>{t('tuWeb.form.title')}</h2><p>{t('tuWeb.form.body')}</p><p className="tw-contact-note">{t('tuWeb.form.noCommitment')}</p><Link to="/para-autonomos" className="tw-directory-link">{t('tuWeb.form.freeDirectory')} <IconArrowRight className="w-4 h-4" aria-hidden="true" /></Link></div>
        <form className="tw-form" onSubmit={prepareRequest}>
          <label htmlFor="web-business">{t('tuWeb.form.business')}</label>
          <input id="web-business" name="business" autoComplete="organization" required maxLength={100} value={business} onChange={update(setBusiness)} placeholder={t('tuWeb.form.businessPlaceholder')} />
          {profile?.business_name ? <button type="button" className="tw-prefill" onClick={() => { setBusiness(profile.business_name.slice(0, 100)); setPrepared(false); }}>{t('tuWeb.form.useProfile')}</button> : null}
          <label htmlFor="web-activity">{t('tuWeb.form.activity')}</label>
          <input id="web-activity" name="activity" required maxLength={100} value={activity} onChange={update(setActivity)} placeholder={t('tuWeb.form.activityPlaceholder')} />
          <label htmlFor="web-plan">{t('tuWeb.form.plan')}</label>
          <select id="web-plan" name="plan" value={plan} onChange={update(setPlan)}>{Object.entries(WEB_PLANS).map(([key, value]) => <option key={key} value={key}>{t(`tuWeb.plans.${key}.title`)} · {money(value)}</option>)}</select>
          <label htmlFor="web-details">{t('tuWeb.form.details')}</label>
          <textarea id="web-details" name="details" rows={3} maxLength={500} value={details} onChange={update(setDetails)} placeholder={t('tuWeb.form.detailsPlaceholder')} />
          <label className="tw-checkbox"><input type="checkbox" checked={maintenance} onChange={event => { setMaintenance(event.target.checked); setPrepared(false); }} /><span>{t('tuWeb.form.maintenance', { price: money(MAINTENANCE_PRICE) })}</span></label>
          <p className="tw-form-note">{t('tuWeb.form.privacy')}</p>
          <button type="submit" className="tw-button tw-button-navy">{t('tuWeb.form.prepare')} <IconArrowRight className="w-4 h-4" aria-hidden="true" /></button>
          <div aria-live="polite" aria-atomic="true">
            {prepared ? <div className="tw-request"><h3>{t('tuWeb.form.ready')}</h3><p>{t('tuWeb.form.review')}</p><details><summary>{t('tuWeb.form.preview')}</summary><pre>{request.text}</pre></details><a className="tw-button tw-button-gold" href={request.whatsapp} target="_blank" rel="noopener noreferrer"><IconMessageSquare className="w-4 h-4" aria-hidden="true" />{t('tuWeb.form.whatsapp')}</a><a className="tw-email" href={request.email}>{t('tuWeb.form.email')}</a></div> : null}
          </div>
        </form>
      </section>

      <section className="tw-faq"><div className="container-page tw-section"><h2>{t('tuWeb.faq.title')}</h2><div>{['free', 'domain', 'material', 'results'].map(key => <details key={key}><summary>{t(`tuWeb.faq.${key}.q`)}</summary><p>{t(`tuWeb.faq.${key}.a`)}</p></details>)}</div></div></section>
    </main>
  );
}
