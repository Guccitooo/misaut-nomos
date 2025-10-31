import React, { useState, useEffect, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Context para compartir el idioma entre componentes
const LanguageContext = createContext({ lang: 'es', setLang: () => {} });

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

// Hook para usar traducciones
export function useTranslation() {
  const context = useContext(LanguageContext);
  
  if (!context) {
    // Fallback si se usa fuera del contexto
    return { 
      t: (key) => translations.es[key] || key, 
      lang: 'es' 
    };
  }

  const { lang } = context;

  const t = (key) => {
    return translations[lang]?.[key] || translations.es[key] || key;
  };

  return { t, lang };
}

// Provider para envolver la app
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('es');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang && ['es', 'en', 'fr'].includes(savedLang)) {
      setLang(savedLang);
      document.documentElement.lang = savedLang;
    } else {
      const browserLang = navigator.language.split('-')[0];
      const supportedLang = ['es', 'en', 'fr'].includes(browserLang) ? browserLang : 'es';
      setLang(supportedLang);
      localStorage.setItem('app_language', supportedLang);
      document.documentElement.lang = supportedLang;
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Componente selector de idioma
export default function LanguageSelector({ className = "" }) {
  const { lang, setLang } = useContext(LanguageContext);

  const handleLanguageChange = (langCode) => {
    setLang(langCode);
    localStorage.setItem('app_language', langCode);
    document.documentElement.lang = langCode;
    window.location.reload();
  };

  const currentLanguage = languages.find(l => l.code === lang) || languages[0];

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
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`cursor-pointer ${lang === language.code ? 'bg-blue-50' : ''}`}
          >
            <span className="mr-2">{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Diccionario de traducciones
const translations = {
  es: {
    'login': 'Iniciar sesión',
    'become_professional': 'Hazte Autónomo',
    'menu': 'Menú',
    'search_professionals': 'Buscar Autónomos',
    'messages': 'Mensajes',
    'favorites': 'Favoritos',
    'my_profile': 'Mi Perfil',
    'view_plans': 'Ver Planes',
    'my_subscription': 'Mi Suscripción',
    'administration': 'Administración',
    'logout': 'Cerrar sesión',
    'hero_title': 'Encuentra el autónomo perfecto',
    'hero_subtitle': 'Profesionales cualificados y verificados en toda España',
    'hero_choose': 'Elige cómo quieres empezar:',
    'im_professional': 'Soy autónomo',
    'im_client': 'Soy cliente',
    'filters': 'Filtros',
    'search_placeholder': 'Buscar servicio, empresa...',
    'all_categories': 'Todas las categorías',
    'all_provinces': 'Todas las provincias',
    'all_cities': 'Todas las ciudades',
    'professionals_available': 'autónomos disponibles',
    'verified_professionals': 'Profesionales verificados en toda España',
    'call': 'Llamar',
    'whatsapp': 'WhatsApp',
    'direct_chat': 'Chat directo',
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
    'cookies_title': 'Usamos cookies para mejorar tu experiencia',
    'cookies_description': 'Utilizamos cookies propias y de terceros para analizar el tráfico, mejorar nuestros servicios y mostrarte publicidad relevante. Al hacer clic en "Aceptar todas", aceptas el uso de todas las cookies. Puedes gestionar tus preferencias en nuestra',
    'cookies_only_necessary': 'Solo necesarias',
    'cookies_accept_all': 'Aceptar todas',
    'professional': 'Autónomo',
    'client': 'Cliente',
    'loading': 'Cargando...',
    'no_results': 'No se encontraron resultados',
    'try_other_filters': 'Prueba con otros filtros o elimina los filtros activos.',
    'view_all': 'Ver todos los autónomos',
    'complete_professional_profile': 'Completa tu perfil profesional',
    'complete_profile_text': 'Para activar tu cuenta y aparecer en las búsquedas, primero debes completar tu perfil profesional.',
    'redirecting_to_quiz': 'Redirigiendo al quiz en 2 segundos...',
  },
  en: {
    'login': 'Log In',
    'become_professional': 'Become a Professional',
    'menu': 'Menu',
    'search_professionals': 'Search Professionals',
    'messages': 'Messages',
    'favorites': 'Favorites',
    'my_profile': 'My Profile',
    'view_plans': 'View Plans',
    'my_subscription': 'My Subscription',
    'administration': 'Administration',
    'logout': 'Log Out',
    'hero_title': 'Find the perfect professional',
    'hero_subtitle': 'Qualified and verified professionals throughout Spain',
    'hero_choose': 'Choose how you want to start:',
    'im_professional': "I'm a professional",
    'im_client': "I'm a client",
    'filters': 'Filters',
    'search_placeholder': 'Search service, company...',
    'all_categories': 'All categories',
    'all_provinces': 'All provinces',
    'all_cities': 'All cities',
    'professionals_available': 'professionals available',
    'verified_professionals': 'Verified professionals throughout Spain',
    'call': 'Call',
    'whatsapp': 'WhatsApp',
    'direct_chat': 'Direct Chat',
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
    'cookies_title': 'We use cookies to improve your experience',
    'cookies_description': 'We use our own and third-party cookies to analyze traffic, improve our services and show you relevant advertising. By clicking "Accept all", you accept the use of all cookies. You can manage your preferences in our',
    'cookies_only_necessary': 'Only necessary',
    'cookies_accept_all': 'Accept all',
    'professional': 'Professional',
    'client': 'Client',
    'loading': 'Loading...',
    'no_results': 'No results found',
    'try_other_filters': 'Try other filters or remove active filters.',
    'view_all': 'View all professionals',
    'complete_professional_profile': 'Complete your professional profile',
    'complete_profile_text': 'To activate your account and appear in searches, you must first complete your professional profile.',
    'redirecting_to_quiz': 'Redirecting to quiz in 2 seconds...',
  },
  fr: {
    'login': 'Se connecter',
    'become_professional': 'Devenir Professionnel',
    'menu': 'Menu',
    'search_professionals': 'Chercher Professionnels',
    'messages': 'Messages',
    'favorites': 'Favoris',
    'my_profile': 'Mon Profil',
    'view_plans': 'Voir les Plans',
    'my_subscription': 'Mon Abonnement',
    'administration': 'Administration',
    'logout': 'Déconnexion',
    'hero_title': 'Trouvez le professionnel parfait',
    'hero_subtitle': 'Professionnels qualifiés et vérifiés dans toute l\'Espagne',
    'hero_choose': 'Choisissez comment vous voulez commencer:',
    'im_professional': 'Je suis professionnel',
    'im_client': 'Je suis client',
    'filters': 'Filtres',
    'search_placeholder': 'Rechercher service, entreprise...',
    'all_categories': 'Toutes les catégories',
    'all_provinces': 'Toutes les provinces',
    'all_cities': 'Toutes les villes',
    'professionals_available': 'professionnels disponibles',
    'verified_professionals': 'Professionnels vérifiés dans toute l\'Espagne',
    'call': 'Appeler',
    'whatsapp': 'WhatsApp',
    'direct_chat': 'Chat Direct',
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
    'cookies_title': 'Nous utilisons des cookies pour améliorer votre expérience',
    'cookies_description': 'Nous utilisons nos propres cookies et ceux de tiers pour analyser le trafic, améliorer nos services et vous montrer des publicités pertinentes. En cliquant sur "Accepter tout", vous acceptez l\'utilisation de tous les cookies. Vous pouvez gérer vos préférences dans notre',
    'cookies_only_necessary': 'Seulement nécessaires',
    'cookies_accept_all': 'Accepter tout',
    'professional': 'Professionnel',
    'client': 'Client',
    'loading': 'Chargement...',
    'no_results': 'Aucun résultat trouvé',
    'try_other_filters': 'Essayez d\'autres filtres ou supprimez les filtres actifs.',
    'view_all': 'Voir tous les professionnels',
    'complete_professional_profile': 'Complétez votre profil professionnel',
    'complete_profile_text': 'Pour activer votre compte et apparaître dans les recherches, vous devez d\'abord compléter votre profil professionnel.',
    'redirecting_to_quiz': 'Redirection vers le quiz dans 2 secondes...',
  }
};