import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Briefcase, Mail, Phone, MapPin, ChevronDown, ChevronUp, Globe, Facebook, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="hidden md:block max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">MisAutónomos</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Tu autónomo de confianza. Conectamos profesionales con clientes en toda España.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-700 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-700 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Navegación</h4>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl("Search")} className="text-gray-400 hover:text-white transition-colors text-sm">
                  Buscar autónomos
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("PricingPlans")} className="text-gray-400 hover:text-white transition-colors text-sm">
                  Hazte autónomo
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("FAQ")} className="text-gray-400 hover:text-white transition-colors text-sm">
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("HelpCenter")} className="text-gray-400 hover:text-white transition-colors text-sm">
                  Centro de ayuda
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl("TermsConditions")} className="text-gray-400 hover:text-white transition-colors text-sm">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("PrivacyPolicy")} className="text-gray-400 hover:text-white transition-colors text-sm">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("CookiePolicy")} className="text-gray-400 hover:text-white transition-colors text-sm">
                  Política de cookies
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("LegalNotice")} className="text-gray-400 hover:text-white transition-colors text-sm">
                  Aviso legal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="mailto:soporte@misautonomos.es" className="hover:text-white transition-colors">
                  soporte@misautonomos.es
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="https://misautonomos.es" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
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
              <Briefcase className="w-5 h-5 text-blue-400" />
              <span className="font-semibold">Sobre MisAutónomos</span>
            </div>
            {openSection === 'about' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {openSection === 'about' && (
            <div className="px-6 pb-4 bg-gray-800/50">
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                Tu autónomo de confianza. Conectamos profesionales con clientes en toda España.
              </p>
              <div className="flex gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-700 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-700 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors">
                  <Linkedin className="w-5 h-5" />
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
            <span className="font-semibold">Navegación</span>
            {openSection === 'navigation' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {openSection === 'navigation' && (
            <div className="px-6 pb-4 bg-gray-800/50 space-y-2">
              <Link to={createPageUrl("Search")} className="block text-gray-400 hover:text-white transition-colors text-sm py-2">
                Buscar autónomos
              </Link>
              <Link to={createPageUrl("PricingPlans")} className="block text-gray-400 hover:text-white transition-colors text-sm py-2">
                Hazte autónomo
              </Link>
              <Link to={createPageUrl("FAQ")} className="block text-gray-400 hover:text-white transition-colors text-sm py-2">
                Preguntas frecuentes
              </Link>
              <Link to={createPageUrl("HelpCenter")} className="block text-gray-400 hover:text-white transition-colors text-sm py-2">
                Centro de ayuda
              </Link>
            </div>
          )}
        </div>

        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('legal')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <span className="font-semibold">Legal</span>
            {openSection === 'legal' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {openSection === 'legal' && (
            <div className="px-6 pb-4 bg-gray-800/50 space-y-2">
              <Link to={createPageUrl("TermsConditions")} className="block text-gray-400 hover:text-white transition-colors text-sm py-2">
                Términos y condiciones
              </Link>
              <Link to={createPageUrl("PrivacyPolicy")} className="block text-gray-400 hover:text-white transition-colors text-sm py-2">
                Política de privacidad
              </Link>
              <Link to={createPageUrl("CookiePolicy")} className="block text-gray-400 hover:text-white transition-colors text-sm py-2">
                Política de cookies
              </Link>
              <Link to={createPageUrl("LegalNotice")} className="block text-gray-400 hover:text-white transition-colors text-sm py-2">
                Aviso legal
              </Link>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => toggleSection('contact')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <span className="font-semibold">Contacto</span>
            {openSection === 'contact' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {openSection === 'contact' && (
            <div className="px-6 pb-4 bg-gray-800/50 space-y-3">
              <a href="mailto:soporte@misautonomos.es" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                <Mail className="w-4 h-4" />
                soporte@misautonomos.es
              </a>
              <a href="https://misautonomos.es" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
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
          <p>© 2025 <strong className="text-white">MisAutónomos</strong>. Todos los derechos reservados.</p>
          <p className="text-xs">Tu autónomo de confianza en España</p>
        </div>
      </div>
    </footer>
  );
}