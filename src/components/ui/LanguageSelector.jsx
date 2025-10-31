import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

export default function LanguageSelector({ className = "" }) {
  const [currentLang, setCurrentLang] = useState('es');

  useEffect(() => {
    // Cargar idioma guardado o detectar del navegador
    const savedLang = localStorage.getItem('app_language');
    if (savedLang) {
      setCurrentLang(savedLang);
      document.documentElement.lang = savedLang;
    } else {
      // Detectar idioma del navegador
      const browserLang = navigator.language.split('-')[0];
      const supportedLang = ['es', 'en', 'fr'].includes(browserLang) ? browserLang : 'es';
      setCurrentLang(supportedLang);
      localStorage.setItem('app_language', supportedLang);
      document.documentElement.lang = supportedLang;
    }
  }, []);

  const handleLanguageChange = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('app_language', langCode);
    document.documentElement.lang = langCode;
    
    // Disparar evento personalizado para que otros componentes se actualicen
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: langCode } }));
    
    // Recargar página para aplicar traducciones
    window.location.reload();
  };

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`flex items-center gap-2 ${className}`}
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`cursor-pointer ${currentLang === lang.code ? 'bg-blue-50' : ''}`}
          >
            <span className="mr-2">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook personalizado para usar traducciones
export function useTranslation() {
  const [lang, setLang] = useState('es');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') || 'es';
    setLang(savedLang);

    const handleLanguageChange = (e) => {
      setLang(e.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const t = (key) => {
    return translations[lang]?.[key] || translations.es[key] || key;
  };

  return { t, lang };
}

// Diccionario de traducciones
const translations = {
  es: {
    // Header
    'login': 'Iniciar sesión',
    'become_professional': 'Hazte Autónomo',
    'menu': 'Menú',
    
    // Navigation
    'search_professionals': 'Buscar Autónomos',
    'messages': 'Mensajes',
    'favorites': 'Favoritos',
    'my_profile': 'Mi Perfil',
    'view_plans': 'Ver Planes',
    'my_subscription': 'Mi Suscripción',
    'administration': 'Administración',
    'logout': 'Cerrar sesión',
    
    // Hero
    'hero_title': 'Encuentra el autónomo perfecto',
    'hero_subtitle': 'Profesionales cualificados y verificados en toda España',
    'hero_choose': 'Elige cómo quieres empezar:',
    'im_professional': 'Soy autónomo',
    'im_client': 'Soy cliente',
    
    // Search & Filters
    'filters': 'Filtros',
    'search_placeholder': 'Buscar servicio, empresa...',
    'all_categories': 'Todas las categorías',
    'all_provinces': 'Todas las provincias',
    'all_cities': 'Todas las ciudades',
    'professionals_available': 'autónomos disponibles',
    'verified_professionals': 'Profesionales verificados en toda España',
    
    // Profile Card
    'call': 'Llamar',
    'whatsapp': 'WhatsApp',
    'direct_chat': 'Chat directo',
    
    // Footer
    'footer_description': 'La plataforma líder para conectar clientes con profesionales autónomos verificados en toda España.',
    'for_professionals': 'Para Profesionales',
    'plans_pricing': 'Planes y Precios',
    'create_profile': 'Crear Perfil',
    'benefits': 'Ventajas de Unirse',
    'help_center': 'Centro de Ayuda',
    'for_clients': 'Para Clientes',
    'search_professionals_link': 'Buscar Autónomos',
    'create_account': 'Crear Cuenta Gratis',
    'all_categories_link': 'Todas las Categorías',
    'faq': 'Preguntas Frecuentes',
    'contact': 'Contacto',
    'all_rights_reserved': 'Todos los derechos reservados',
    'privacy_policy': 'Política de Privacidad',
    'terms_conditions': 'Términos y Condiciones',
    'cookie_policy': 'Política de Cookies',
    'legal_notice': 'Aviso Legal',
    
    // Cookies
    'cookies_title': 'Usamos cookies para mejorar tu experiencia',
    'cookies_description': 'Utilizamos cookies propias y de terceros para analizar el tráfico, mejorar nuestros servicios y mostrarte publicidad relevante. Al hacer clic en "Aceptar todas", aceptas el uso de todas las cookies. Puedes gestionar tus preferencias en nuestra',
    'cookies_only_necessary': 'Solo necesarias',
    'cookies_accept_all': 'Aceptar todas',
    
    // User types
    'professional': 'Autónomo',
    'client': 'Cliente',
    
    // Common
    'loading': 'Cargando...',
    'no_results': 'No se encontraron resultados',
    'try_other_filters': 'Prueba con otros filtros o elimina los filtros activos.',
    'view_all': 'Ver todos los autónomos',
  },
  en: {
    // Header
    'login': 'Log In',
    'become_professional': 'Become a Professional',
    'menu': 'Menu',
    
    // Navigation
    'search_professionals': 'Search Professionals',
    'messages': 'Messages',
    'favorites': 'Favorites',
    'my_profile': 'My Profile',
    'view_plans': 'View Plans',
    'my_subscription': 'My Subscription',
    'administration': 'Administration',
    'logout': 'Log Out',
    
    // Hero
    'hero_title': 'Find the perfect professional',
    'hero_subtitle': 'Qualified and verified professionals throughout Spain',
    'hero_choose': 'Choose how you want to start:',
    'im_professional': "I'm a professional",
    'im_client': "I'm a client",
    
    // Search & Filters
    'filters': 'Filters',
    'search_placeholder': 'Search service, company...',
    'all_categories': 'All categories',
    'all_provinces': 'All provinces',
    'all_cities': 'All cities',
    'professionals_available': 'professionals available',
    'verified_professionals': 'Verified professionals throughout Spain',
    
    // Profile Card
    'call': 'Call',
    'whatsapp': 'WhatsApp',
    'direct_chat': 'Direct Chat',
    
    // Footer
    'footer_description': 'The leading platform to connect clients with verified self-employed professionals throughout Spain.',
    'for_professionals': 'For Professionals',
    'plans_pricing': 'Plans & Pricing',
    'create_profile': 'Create Profile',
    'benefits': 'Join Benefits',
    'help_center': 'Help Center',
    'for_clients': 'For Clients',
    'search_professionals_link': 'Search Professionals',
    'create_account': 'Create Free Account',
    'all_categories_link': 'All Categories',
    'faq': 'FAQ',
    'contact': 'Contact',
    'all_rights_reserved': 'All rights reserved',
    'privacy_policy': 'Privacy Policy',
    'terms_conditions': 'Terms & Conditions',
    'cookie_policy': 'Cookie Policy',
    'legal_notice': 'Legal Notice',
    
    // Cookies
    'cookies_title': 'We use cookies to improve your experience',
    'cookies_description': 'We use our own and third-party cookies to analyze traffic, improve our services and show you relevant advertising. By clicking "Accept all", you accept the use of all cookies. You can manage your preferences in our',
    'cookies_only_necessary': 'Only necessary',
    'cookies_accept_all': 'Accept all',
    
    // User types
    'professional': 'Professional',
    'client': 'Client',
    
    // Common
    'loading': 'Loading...',
    'no_results': 'No results found',
    'try_other_filters': 'Try other filters or remove active filters.',
    'view_all': 'View all professionals',
  },
  fr: {
    // Header
    'login': 'Se connecter',
    'become_professional': 'Devenir Professionnel',
    'menu': 'Menu',
    
    // Navigation
    'search_professionals': 'Chercher Professionnels',
    'messages': 'Messages',
    'favorites': 'Favoris',
    'my_profile': 'Mon Profil',
    'view_plans': 'Voir les Plans',
    'my_subscription': 'Mon Abonnement',
    'administration': 'Administration',
    'logout': 'Déconnexion',
    
    // Hero
    'hero_title': 'Trouvez le professionnel parfait',
    'hero_subtitle': 'Professionnels qualifiés et vérifiés dans toute l\'Espagne',
    'hero_choose': 'Choisissez comment vous voulez commencer:',
    'im_professional': 'Je suis professionnel',
    'im_client': 'Je suis client',
    
    // Search & Filters
    'filters': 'Filtres',
    'search_placeholder': 'Rechercher service, entreprise...',
    'all_categories': 'Toutes les catégories',
    'all_provinces': 'Toutes les provinces',
    'all_cities': 'Toutes les villes',
    'professionals_available': 'professionnels disponibles',
    'verified_professionals': 'Professionnels vérifiés dans toute l\'Espagne',
    
    // Profile Card
    'call': 'Appeler',
    'whatsapp': 'WhatsApp',
    'direct_chat': 'Chat Direct',
    
    // Footer
    'footer_description': 'La plateforme leader pour connecter les clients avec des professionnels indépendants vérifiés dans toute l\'Espagne.',
    'for_professionals': 'Pour les Professionnels',
    'plans_pricing': 'Plans et Tarifs',
    'create_profile': 'Créer un Profil',
    'benefits': 'Avantages de Rejoindre',
    'help_center': 'Centre d\'Aide',
    'for_clients': 'Pour les Clients',
    'search_professionals_link': 'Chercher Professionnels',
    'create_account': 'Créer un Compte Gratuit',
    'all_categories_link': 'Toutes les Catégories',
    'faq': 'FAQ',
    'contact': 'Contact',
    'all_rights_reserved': 'Tous droits réservés',
    'privacy_policy': 'Politique de Confidentialité',
    'terms_conditions': 'Termes et Conditions',
    'cookie_policy': 'Politique de Cookies',
    'legal_notice': 'Mention Légale',
    
    // Cookies
    'cookies_title': 'Nous utilisons des cookies pour améliorer votre expérience',
    'cookies_description': 'Nous utilisons nos propres cookies et ceux de tiers pour analyser le trafic, améliorer nos services et vous montrer des publicités pertinentes. En cliquant sur "Accepter tout", vous acceptez l\'utilisation de tous les cookies. Vous pouvez gérer vos préférences dans notre',
    'cookies_only_necessary': 'Seulement nécessaires',
    'cookies_accept_all': 'Accepter tout',
    
    // User types
    'professional': 'Professionnel',
    'client': 'Client',
    
    // Common
    'loading': 'Chargement...',
    'no_results': 'Aucun résultat trouvé',
    'try_other_filters': 'Essayez d\'autres filtres ou supprimez les filtres actifs.',
    'view_all': 'Voir tous les professionnels',
  }
};