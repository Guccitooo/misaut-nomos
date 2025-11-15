import React, { createContext, useContext, useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const translations = {
  es: {
    // Navigation
    searchFreelancers: 'Buscar autónomos',
    messages: 'Mensajes',
    favorites: 'Favoritos',
    myProfile: 'Mi Perfil',
    mySubscription: 'Mi Suscripción',
    administration: 'Administración',
    viewPlans: 'Ver Planes',
    logout: 'Cerrar sesión',
    login: 'Iniciar sesión',
    becomeFreelancer: 'Hazte autónomo',
    
    // Search
    filters: 'Filtros',
    search: 'Buscar...',
    allCategories: 'Todas las categorías',
    allProvinces: 'Todas las provincias',
    allCities: 'Todas las ciudades',
    freelancersAvailable: 'autónomos disponibles',
    verifiedProfessionals: 'Profesionales verificados',
    noResults: 'No se encontraron resultados',
    tryDifferentFilters: 'Intenta con otros filtros o busca en otra ubicación',
    viewAll: 'Ver todos',
    
    // Hero
    heroTitle: 'Encuentra tu autónomo de confianza',
    heroSubtitle: 'Conecta con profesionales verificados cerca de ti. Rápido, fácil y seguro.',
    chooseHow: '¿Cómo quieres usar MisAutónomos?',
    imFreelancer: 'Soy autónomo',
    imClient: 'Busco servicios',
    
    // Categories
    'Electricista': 'Electricista',
    'Fontanero': 'Fontanero',
    'Carpintero': 'Carpintero',
    'Albañil / Reformas': 'Albañil / Reformas',
    'Pintor': 'Pintor',
    'Jardinero': 'Jardinero',
    'Transportista': 'Transportista',
    'Autónomo de limpieza': 'Limpieza',
    'Cerrajero': 'Cerrajero',
    'Instalador de aire acondicionado': 'Aire acondicionado',
    'Mantenimiento general': 'Mantenimiento',
    
    // Footer
    tagline: 'Tu autónomo de confianza',
    platformDescription: 'Conectamos profesionales con clientes en toda España',
    forProfessionals: 'Para Profesionales',
    forClients: 'Para Clientes',
    contact: 'Contacto',
    plansAndPricing: 'Planes y precios',
    createProfile: 'Crear perfil',
    joinAdvantages: 'Ventajas de unirse',
    helpCenter: 'Centro de ayuda',
    createFreeAccount: 'Crear cuenta gratis',
    faq: 'Preguntas frecuentes',
    privacyPolicy: 'Política de privacidad',
    termsConditions: 'Términos y condiciones',
    cookiePolicy: 'Política de cookies',
    legalNotice: 'Aviso legal',
  },
  en: {
    // Navigation
    searchFreelancers: 'Find Professionals',
    messages: 'Messages',
    favorites: 'Favorites',
    myProfile: 'My Profile',
    mySubscription: 'My Subscription',
    administration: 'Administration',
    viewPlans: 'View Plans',
    logout: 'Log out',
    login: 'Log in',
    becomeFreelancer: 'Become a professional',
    
    // Search
    filters: 'Filters',
    search: 'Search...',
    allCategories: 'All categories',
    allProvinces: 'All provinces',
    allCities: 'All cities',
    freelancersAvailable: 'professionals available',
    verifiedProfessionals: 'Verified professionals',
    noResults: 'No results found',
    tryDifferentFilters: 'Try different filters or search in another location',
    viewAll: 'View all',
    
    // Hero
    heroTitle: 'Find your trusted professional',
    heroSubtitle: 'Connect with verified professionals near you. Fast, easy and secure.',
    chooseHow: 'How do you want to use MisAutónomos?',
    imFreelancer: "I'm a professional",
    imClient: 'I need services',
    
    // Categories
    'Electricista': 'Electrician',
    'Fontanero': 'Plumber',
    'Carpintero': 'Carpenter',
    'Albañil / Reformas': 'Construction',
    'Pintor': 'Painter',
    'Jardinero': 'Gardener',
    'Transportista': 'Transport',
    'Autónomo de limpieza': 'Cleaning',
    'Cerrajero': 'Locksmith',
    'Instalador de aire acondicionado': 'Air conditioning',
    'Mantenimiento general': 'Maintenance',
    
    // Footer
    tagline: 'Your trusted professional',
    platformDescription: 'Connecting professionals with clients across Spain',
    forProfessionals: 'For Professionals',
    forClients: 'For Clients',
    contact: 'Contact',
    plansAndPricing: 'Plans & Pricing',
    createProfile: 'Create profile',
    joinAdvantages: 'Join advantages',
    helpCenter: 'Help center',
    createFreeAccount: 'Create free account',
    faq: 'FAQ',
    privacyPolicy: 'Privacy Policy',
    termsConditions: 'Terms & Conditions',
    cookiePolicy: 'Cookie Policy',
    legalNotice: 'Legal Notice',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('es');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'es';
    setLanguage(savedLang);
    document.documentElement.lang = savedLang;
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.es[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

export default function LanguageSwitcher({ variant = "default" }) {
  const { language, changeLanguage } = useLanguage();

  if (variant === "compact") {
    return (
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => changeLanguage('es')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            language === 'es'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          ES
        </button>
        <button
          onClick={() => changeLanguage('en')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            language === 'en'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          EN
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-gray-100">
          <Globe className="h-5 w-5 text-gray-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white">
        <DropdownMenuItem
          onClick={() => changeLanguage('es')}
          className={language === 'es' ? 'bg-blue-50 text-blue-900 font-semibold' : ''}
        >
          🇪🇸 Español
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          className={language === 'en' ? 'bg-blue-50 text-blue-900 font-semibold' : ''}
        >
          🇬🇧 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}