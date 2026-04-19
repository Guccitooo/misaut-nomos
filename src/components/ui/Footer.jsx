import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Mail, Instagram, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const socialLinks = [
  { href: "https://www.instagram.com/misautonomos/", label: "Instagram", icon: Instagram, hoverClass: "hover:bg-pink-600" },
  { href: "https://www.facebook.com/misautonomos", label: "Facebook", icon: FacebookIcon, hoverClass: "hover:bg-blue-600" },
  { href: "https://www.linkedin.com/company/misautonomos", label: "LinkedIn", icon: LinkedInIcon, hoverClass: "hover:bg-blue-700" },
  { href: "https://www.tiktok.com/@misautonomos", label: "TikTok", icon: TikTokIcon, hoverClass: "hover:bg-gray-950" },
];

const platformLinks = [
  { label: "Sobre nosotros", to: createPageUrl("Home") },
  { label: "Cómo funciona", to: createPageUrl("DashboardProInfo") },
  { label: "Para autónomos", to: createPageUrl("PricingPlans") },
  { label: "Para clientes", to: createPageUrl("ClientOnboarding") },
  { label: "Centro de ayuda", to: createPageUrl("FAQ") },
];

const resourceLinks = [
  { label: "Blog", to: "/blog" },
];

const legalLinks = [
  { label: "Política de privacidad", to: createPageUrl("PrivacyPolicy") },
  { label: "Términos de uso", to: createPageUrl("TermsConditions") },
  { label: "Política de cookies", to: createPageUrl("CookiePolicy") },
  { label: "Aviso legal", to: createPageUrl("LegalNotice") },
];

function NewsletterInlineForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const { i18n } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      const { NewsletterSubscriber } = await import('@/api/entities');
      const existing = await NewsletterSubscriber.filter({ email: email.toLowerCase() }).limit(1);
      if (existing.length > 0) {
        if (existing[0].status === 'unsubscribed') {
          await NewsletterSubscriber.update(existing[0].id, { status: 'confirmed', confirmed_at: new Date().toISOString() });
        }
        setStatus('success');
        return;
      }
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      await NewsletterSubscriber.create({
        email: email.toLowerCase().trim(),
        status: 'confirmed',
        language: i18n.language || 'es',
        source: 'footer',
        confirmation_token: token,
        unsubscribe_token: Math.random().toString(36).substring(2) + Date.now().toString(36),
        confirmed_at: new Date().toISOString()
      });
      setStatus('success');
      setEmail('');
    } catch { setStatus('idle'); }
  };

  if (status === 'success') {
    return (
      <div className="text-xs text-green-400 flex items-center gap-1.5 whitespace-nowrap">
        <Check className="w-3.5 h-3.5" />¡Gracias! Revisa tu email.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full md:w-auto md:min-w-[300px]">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
        disabled={status === 'loading'}
        className="flex-1 bg-white/5 border border-white/10 rounded-l-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/30 border-r-0"
      />
      <button 
        type="submit" 
        disabled={status === 'loading'}
        className="bg-white text-gray-900 text-xs font-medium px-3 py-1.5 rounded-r-lg hover:bg-gray-100 disabled:opacity-50 whitespace-nowrap"
      >
        {status === 'loading' ? '...' : 'Suscribirme'}
      </button>
    </form>
  );
}

export default function Footer() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => setCurrentUser(u))
      .catch(() => setCurrentUser(null))
      .finally(() => setLoadingUser(false));
  }, []);

  return (
    <footer className="bg-slate-900 text-gray-300">
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-24 md:pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={LOGO_URL} alt="MisAutónomos" className="w-11 h-11 rounded-xl" width="44" height="44" loading="lazy" />
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">MisAutónomos</h3>
                <p className="text-xs text-gray-400">Tu autónomo de confianza</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5 max-w-xs">
              La plataforma que conecta a clientes con profesionales autónomos verificados en toda España.
            </p>
            <div className="flex gap-2.5">
              {socialLinks.map(({ href, label, icon: Icon, hoverClass }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className={`w-9 h-9 bg-slate-800 ${hoverClass} rounded-lg flex items-center justify-center transition-colors`}>
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Plataforma</h4>
            <ul className="space-y-2.5">
              {platformLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Recursos</h4>
            <ul className="space-y-2.5">
              {resourceLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {legalLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:hola@misautonomos.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  hola@misautonomos.com
                </a>
              </li>
              <li className="text-sm text-gray-500 pt-1">
                Conectamos clientes con autónomos verificados en toda España. Contacto directo, sin comisiones.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter compacta inline - SOLO para usuarios NO logueados */}
      {!loadingUser && !currentUser && (
        <div className="border-t border-slate-800/60">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-xs text-gray-400">
                <span className="text-white font-medium">Newsletter:</span> 1-2 emails al mes con consejos prácticos. Sin spam.
              </div>
              <NewsletterInlineForm />
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500 text-center sm:text-left">
             © 2026 <span className="text-gray-400 font-medium">MisAutónomos</span>. Todos los derechos reservados.
           </p>
          <p className="text-xs text-gray-600">Tu autónomo de confianza</p>
        </div>
      </div>
    </footer>
  );
}