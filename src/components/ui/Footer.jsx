import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mail, MapPin, ChevronDown, ChevronUp, Globe, Instagram } from "lucide-react";
import { useLanguage } from "./LanguageSwitcher";

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';

export default function Footer() {
  const [openSection, setOpenSection] = useState(null);
  const { t } = useLanguage();

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="hidden md:block max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src={LOGO_URL}
                alt="MisAutónomos"
                className="w-12 h-12 rounded-lg"
                loading="lazy"
              />
              <h3 className="text-xl font-bold">MisAutónomos</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('platformDescription')}
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://www.instagram.com/misautonomos/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-700 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.tiktok.com/@misautonomos" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-700 hover:bg-black rounded-lg flex items-center justify-center transition-colors" aria-label="TikTok">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">{t('navigation')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl("Search")} className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  {t('searchFreelancers')}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("PricingPlans")} className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  {t('becomeFreelancer')}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("DashboardProInfo")} className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  {t('dashboardProInfo') || 'Dashboard Pro'}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("FAQ")} className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  {t('faq')}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("HelpCenter")} className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  {t('helpCenter')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">{t('legal')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl("TermsConditions")} className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  {t('termsAndConditions')}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("PrivacyPolicy")} className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.dispatchEvent(new Event('cookie-consent-reopen'));
                  }}
                  className="text-gray-400 hover:text-blue-400 transition-colors text-sm text-left"
                >
                  {t('cookiePolicy')}
                </button>
              </li>
              <li>
                <Link to={createPageUrl("LegalNotice")} className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  {t('legalNotice')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">{t('contact')}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="mailto:soporte@misautonomos.es" className="hover:text-blue-400 transition-colors">
                  soporte@misautonomos.es
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="https://misautonomos.es" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                  misautonomos.es
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>España</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('about')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="MisAutónomos" className="w-8 h-8 rounded" />
              <span className="font-semibold">MisAutónomos</span>
            </div>
            {openSection === 'about' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {openSection === 'about' && (
            <div className="px-6 pb-4 bg-gray-800/50">
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                {t('platformDescription')}
              </p>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/misautonomos/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-700 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors" aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://www.tiktok.com/@misautonomos" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-700 hover:bg-black rounded-lg flex items-center justify-center transition-colors" aria-label="TikTok">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('navigation')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <span className="font-semibold">{t('navigation')}</span>
            {openSection === 'navigation' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {openSection === 'navigation' && (
            <div className="px-6 pb-4 bg-gray-800/50 space-y-2">
              <Link to={createPageUrl("Search")} className="block text-gray-400 hover:text-blue-400 transition-colors text-sm py-2">
                {t('searchFreelancers')}
              </Link>
              <Link to={createPageUrl("PricingPlans")} className="block text-gray-400 hover:text-blue-400 transition-colors text-sm py-2">
                {t('becomeFreelancer')}
              </Link>
              <Link to={createPageUrl("DashboardProInfo")} className="block text-gray-400 hover:text-blue-400 transition-colors text-sm py-2">
                {t('dashboardProInfo') || 'Dashboard Pro'}
              </Link>
              <Link to={createPageUrl("FAQ")} className="block text-gray-400 hover:text-blue-400 transition-colors text-sm py-2">
                {t('faq')}
              </Link>
              <Link to={createPageUrl("HelpCenter")} className="block text-gray-400 hover:text-blue-400 transition-colors text-sm py-2">
                {t('helpCenter')}
              </Link>
            </div>
          )}
        </div>

        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('legal')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <span className="font-semibold">{t('legal')}</span>
            {openSection === 'legal' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {openSection === 'legal' && (
            <div className="px-6 pb-4 bg-gray-800/50 space-y-2">
              <Link to={createPageUrl("TermsConditions")} className="block text-gray-400 hover:text-blue-400 transition-colors text-sm py-2">
                {t('termsAndConditions')}
              </Link>
              <Link to={createPageUrl("PrivacyPolicy")} className="block text-gray-400 hover:text-blue-400 transition-colors text-sm py-2">
                {t('privacyPolicy')}
              </Link>
              <Link to={createPageUrl("CookiePolicy")} className="block text-gray-400 hover:text-blue-400 transition-colors text-sm py-2">
                {t('cookiePolicy')}
              </Link>
              <Link to={createPageUrl("LegalNotice")} className="block text-gray-400 hover:text-blue-400 transition-colors text-sm py-2">
                {t('legalNotice')}
              </Link>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => toggleSection('contact')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <span className="font-semibold">{t('contact')}</span>
            {openSection === 'contact' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {openSection === 'contact' && (
            <div className="px-6 pb-4 bg-gray-800/50 space-y-3">
              <a href="mailto:soporte@misautonomos.es" className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors text-sm">
                <Mail className="w-4 h-4" />
                soporte@misautonomos.es
              </a>
              <a href="https://misautonomos.es" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors text-sm">
                <Globe className="w-4 h-4" />
                misautonomos.es
              </a>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4" />
                España
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-700 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="text-center md:text-left">
            <p>© 2025 <strong className="text-white">MisAutónomos</strong>. {t('allRightsReserved')}.</p>
            <p className="text-xs mt-1">Astra Invest and Finance S.L. · CIF: B10865418</p>
          </div>
          <p className="text-xs">{t('tagline')}</p>
        </div>
      </div>
    </footer>
  );
}