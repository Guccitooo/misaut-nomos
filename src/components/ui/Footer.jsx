import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Mail, Phone, Briefcase } from "lucide-react";
import { useLanguage } from "./LanguageSwitcher";

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">MilAutónomos</h3>
                <p className="text-xs text-gray-400">{t('tagline')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              {t('platformDescription')}
            </p>
            <div className="flex gap-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-blue-400 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-blue-700 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Para Profesionales */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4">{t('forProfessionals')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={createPageUrl("PricingPlans")} className="hover:text-white transition-colors">
                  {t('plansAndPricing')}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("ProfileOnboarding")} className="hover:text-white transition-colors">
                  {t('createProfile')}
                </Link>
              </li>
              <li>
                <a href="#ventajas" className="hover:text-white transition-colors">
                  {t('joinAdvantages')}
                </a>
              </li>
              <li>
                <a href="#ayuda" className="hover:text-white transition-colors">
                  {t('helpCenter')}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Para Clientes */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4">{t('forClients')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={createPageUrl("Search")} className="hover:text-white transition-colors">
                  {t('searchFreelancers')}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("ClientOnboarding")} className="hover:text-white transition-colors">
                  {t('createFreeAccount')}
                </Link>
              </li>
              <li>
                <a href="#categorias" className="hover:text-white transition-colors">
                  {t('allCategories')}
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  {t('faq')}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contacto */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4">{t('contact')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <span>Madrid, España</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <a href="mailto:contacto@milautonomos.com" className="hover:text-white transition-colors">
                  contacto@milautonomos.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <a href="tel:+34900123456" className="hover:text-white transition-colors">
                  +34 900 123 456
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-6"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div className="text-gray-400 text-center md:text-left">
            © {new Date().getFullYear()} MilAutónomos. {t('allRightsReserved')}.
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#privacidad" className="hover:text-white transition-colors">
              {t('privacyPolicy')}
            </a>
            <span className="text-gray-600">•</span>
            <a href="#terminos" className="hover:text-white transition-colors">
              {t('termsConditions')}
            </a>
            <span className="text-gray-600">•</span>
            <a href="#cookies" className="hover:text-white transition-colors">
              {t('cookiePolicy')}
            </a>
            <span className="text-gray-600">•</span>
            <a href="#legal" className="hover:text-white transition-colors">
              {t('legalNotice')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}