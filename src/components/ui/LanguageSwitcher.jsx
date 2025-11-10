
import React, { useState, useEffect, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const translations = {
  es: {
    // Header
    login: "Iniciar sesión",
    becomeFreelancer: "Hazte Autónomo",
    
    // Hero
    heroTitle: "Encuentra el autónomo perfecto",
    heroSubtitle: "Profesionales cualificados y verificados en toda España",
    chooseHow: "Elige cómo quieres empezar:",
    imFreelancer: "Soy autónomo",
    imClient: "Soy cliente",
    
    // Navigation
    searchFreelancers: "Buscar Autónomos",
    messages: "Mensajes",
    favorites: "Favoritos",
    myProfile: "Mi Perfil",
    viewPlans: "Ver Planes",
    mySubscription: "Mi Suscripción",
    administration: "Administración",
    logout: "Cerrar sesión",
    
    // Search & Filters
    filters: "Filtros",
    search: "Buscar servicio, empresa...",
    allCategories: "Todas las categorías",
    allProvinces: "Todas las provincias",
    allCities: "Todas las ciudades",
    freelancersAvailable: "autónomos disponibles",
    verifiedProfessionals: "Profesionales verificados en toda España",
    
    // Categories (for translation)
    "Electricista": "Electricista",
    "Carpintero": "Carpintero",
    "Fontanero": "Fontanero",
    "Albañil / Reformas": "Albañil / Reformas",
    "Pintor": "Pintor",
    "Jardinero": "Jardinero",
    "Transportista": "Transportista",
    "Autónomo de limpieza": "Autónomo de limpieza",
    "Cerrajero": "Cerrajero",
    "Instalador de aire acondicionado": "Instalador de aire acondicionado",
    "Mantenimiento general": "Mantenimiento general",
    
    // Footer
    aboutUs: "Sobre Nosotros",
    tagline: "Tu autónomo de confianza",
    platformDescription: "La plataforma líder para conectar clientes con profesionales autónomos verificados en toda España.",
    viewProfile: "Ver Perfil", // Added this line
    forProfessionals: "Para Profesionales",
    plansAndPricing: "Planes y Precios",
    createProfile: "Crear Perfil",
    joinAdvantages: "Ventajas de Unirse",
    helpCenter: "Centro de Ayuda",
    forClients: "Para Clientes",
    createFreeAccount: "Crear Cuenta Gratis",
    allCategories: "Todas las Categorías",
    faq: "Preguntas Frecuentes",
    contact: "Contacto",
    allRightsReserved: "Todos los derechos reservados",
    privacyPolicy: "Política de Privacidad",
    termsConditions: "Términos y Condiciones",
    cookiePolicy: "Política de Cookies",
    legalNotice: "Aviso Legal",
    
    // Cookie Banner
    cookieTitle: "Usamos cookies para mejorar tu experiencia",
    cookieText: "Utilizamos cookies propias y de terceros para analizar el tráfico, mejorar nuestros servicios y mostrarte publicidad relevante. Al hacer clic en",
    acceptAll: "Aceptar todas",
    cookieAccept: "aceptas el uso de todas las cookies. Puedes gestionar tus preferencias en nuestra",
    onlyNecessary: "Solo necesarias",
    
    // Common
    loading: "Cargando...",
    noResults: "No se encontraron resultados",
    tryDifferentFilters: "Prueba con otros filtros o elimina los filtros activos.",
    viewAll: "Ver todos los autónomos",
  },
  en: {
    // Header
    login: "Login",
    becomeFreelancer: "Become a Freelancer",
    
    // Hero
    heroTitle: "Find the perfect freelancer",
    heroSubtitle: "Qualified and verified professionals throughout Spain",
    chooseHow: "Choose how you want to start:",
    imFreelancer: "I'm a freelancer",
    imClient: "I'm a client",
    
    // Navigation
    searchFreelancers: "Search Freelancers",
    messages: "Messages",
    favorites: "Favorites",
    myProfile: "My Profile",
    viewPlans: "View Plans",
    mySubscription: "My Subscription",
    administration: "Administration",
    logout: "Logout",
    
    // Search & Filters
    filters: "Filters",
    search: "Search service, company...",
    allCategories: "All categories",
    allProvinces: "All provinces",
    allCities: "All cities",
    freelancersAvailable: "freelancers available",
    verifiedProfessionals: "Verified professionals throughout Spain",
    
    // Categories (translated)
    "Electricista": "Electrician",
    "Carpintero": "Carpenter",
    "Fontanero": "Plumber",
    "Albañil / Reformas": "Mason / Renovations",
    "Pintor": "Painter",
    "Jardinero": "Gardener",
    "Transportista": "Carrier",
    "Autónomo de limpieza": "Cleaning Professional",
    "Cerrajero": "Locksmith",
    "Instalador de aire acondicionado": "Air Conditioning Installer",
    "Mantenimiento general": "General Maintenance",
    
    // Footer
    aboutUs: "About Us",
    tagline: "Your trusted freelancer",
    platformDescription: "The leading platform to connect clients with verified freelance professionals throughout Spain.",
    viewProfile: "View Profile", // Added for consistency in EN translation
    forProfessionals: "For Professionals",
    plansAndPricing: "Plans & Pricing",
    createProfile: "Create Profile",
    joinAdvantages: "Join Advantages",
    helpCenter: "Help Center",
    forClients: "For Clients",
    createFreeAccount: "Create Free Account",
    allCategories: "All Categories",
    faq: "FAQ",
    contact: "Contact",
    allRightsReserved: "All rights reserved",
    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms & Conditions",
    cookiePolicy: "Cookie Policy",
    legalNotice: "Legal Notice",
    
    // Cookie Banner
    cookieTitle: "We use cookies to improve your experience",
    cookieText: "We use our own and third-party cookies to analyze traffic, improve our services and show you relevant advertising. By clicking",
    acceptAll: "Accept all",
    cookieAccept: "you accept the use of all cookies. You can manage your preferences in our",
    onlyNecessary: "Only necessary",
    
    // Common
    loading: "Loading...",
    noResults: "No results found",
    tryDifferentFilters: "Try different filters or remove active filters.",
    viewAll: "View all freelancers",
  }
};

// ✅ Context para que el idioma sea reactivo globalmente
const LanguageContext = createContext({
  language: 'es',
  changeLanguage: () => {},
  t: () => ''
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Check if localStorage is available (client-side)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('language') || 'es';
    }
    return 'es'; // Default to 'es' if localStorage is not available (server-side rendering)
  });

  useEffect(() => {
    // Ensure document.documentElement is available (client-side)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', language);
    }
  }, [language]);

  const changeLanguage = (lang) => {
    console.log('🌍 Cambiando idioma a:', lang);
    setLanguage(lang);
    // Check if localStorage is available before using it
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['es'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  }
  return context;
};

export default function LanguageSwitcher({ variant = "default" }) {
  const { language, changeLanguage } = useLanguage();

  // Variante compacta para header (sin dropdown)
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
        <Globe className="w-4 h-4 text-gray-600" />
        <button
          onClick={() => changeLanguage('es')}
          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
            language === 'es' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          ES
        </button>
        <button
          onClick={() => changeLanguage('en')}
          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
            language === 'en' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          EN
        </button>
      </div>
    );
  }

  // Variante default (dropdown)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-gray-100">
          <Globe className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => changeLanguage('es')}
          className={language === 'es' ? 'bg-blue-50 font-semibold' : ''}
        >
          🇪🇸 Español
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage('en')}
          className={language === 'en' ? 'bg-blue-50 font-semibold' : ''}
        >
          🇬🇧 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
