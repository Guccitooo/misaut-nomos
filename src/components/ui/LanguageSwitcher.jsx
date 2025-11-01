import React, { useState, useEffect, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const translations = {
  es: {
    searchFreelancers: "Buscar Autónomos",
    messages: "Mensajes",
    favorites: "Favoritos",
    myProfile: "Mi Perfil",
    mySubscription: "Mi Suscripción",
    viewPlans: "Ver Planes",
    administration: "Administración",
    logout: "Cerrar Sesión",
    search: "Buscar...",
    allCategories: "Todas las Categorías",
    allProvinces: "Todas las Provincias",
    allCities: "Todas las Ciudades",
    filters: "Filtros",
    freelancersAvailable: "autónomos disponibles",
    verifiedProfessionals: "Profesionales verificados con suscripción activa",
    loading: "Cargando...",
    noResults: "No se encontraron resultados",
    tryDifferentFilters: "Intenta ajustar los filtros o buscar con otros términos",
    viewAll: "Ver Todos",
    heroTitle: "Encuentra al Profesional Perfecto",
    heroSubtitle: "Miles de autónomos verificados listos para ayudarte",
    chooseHow: "¿Cómo quieres usar MilAutónomos?",
    imFreelancer: "Soy Autónomo",
    imClient: "Soy Cliente",
    
    // Categorías
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
    tagline: "Tu autónomo de confianza",
    platformDescription: "Conectamos profesionales autónomos con clientes que necesitan sus servicios.",
    forProfessionals: "Para Profesionales",
    plansAndPricing: "Planes y Precios",
    createProfile: "Crear Perfil",
    joinAdvantages: "Ventajas de Unirse",
    helpCenter: "Centro de Ayuda",
    forClients: "Para Clientes",
    createFreeAccount: "Crear Cuenta Gratis",
    faq: "Preguntas Frecuentes",
    contact: "Contacto",
    allRightsReserved: "Todos los derechos reservados",
    privacyPolicy: "Política de Privacidad",
    termsConditions: "Términos y Condiciones",
    cookiePolicy: "Política de Cookies",
    legalNotice: "Aviso Legal",
    
    // Cookies
    cookieTitle: "Usamos cookies",
    cookieText: "Utilizamos cookies para mejorar tu experiencia. Consulta nuestra",
    onlyNecessary: "Rechazar",
    acceptAll: "Aceptar todas",
  },
  en: {
    searchFreelancers: "Search Freelancers",
    messages: "Messages",
    favorites: "Favorites",
    myProfile: "My Profile",
    mySubscription: "My Subscription",
    viewPlans: "View Plans",
    administration: "Administration",
    logout: "Logout",
    search: "Search...",
    allCategories: "All Categories",
    allProvinces: "All Provinces",
    allCities: "All Cities",
    filters: "Filters",
    freelancersAvailable: "freelancers available",
    verifiedProfessionals: "Verified professionals with active subscription",
    loading: "Loading...",
    noResults: "No results found",
    tryDifferentFilters: "Try adjusting the filters or search with different terms",
    viewAll: "View All",
    heroTitle: "Find the Perfect Professional",
    heroSubtitle: "Thousands of verified freelancers ready to help you",
    chooseHow: "How do you want to use MilAutónomos?",
    imFreelancer: "I'm a Freelancer",
    imClient: "I'm a Client",
    
    // Categories
    "Electricista": "Electrician",
    "Carpintero": "Carpenter",
    "Fontanero": "Plumber",
    "Albañil / Reformas": "Mason / Renovations",
    "Pintor": "Painter",
    "Jardinero": "Gardener",
    "Transportista": "Driver / Transport",
    "Autónomo de limpieza": "Cleaning Professional",
    "Cerrajero": "Locksmith",
    "Instalador de aire acondicionado": "AC Installer",
    "Mantenimiento general": "General Maintenance",
    
    // Footer
    tagline: "Your trusted freelancer",
    platformDescription: "We connect freelance professionals with clients who need their services.",
    forProfessionals: "For Professionals",
    plansAndPricing: "Plans & Pricing",
    createProfile: "Create Profile",
    joinAdvantages: "Join Advantages",
    helpCenter: "Help Center",
    forClients: "For Clients",
    createFreeAccount: "Create Free Account",
    faq: "FAQ",
    contact: "Contact",
    allRightsReserved: "All rights reserved",
    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms & Conditions",
    cookiePolicy: "Cookie Policy",
    legalNotice: "Legal Notice",
    
    // Cookies
    cookieTitle: "We use cookies",
    cookieText: "We use cookies to improve your experience. Check our",
    onlyNecessary: "Reject",
    acceptAll: "Accept all",
  },
  fr: {
    searchFreelancers: "Rechercher des Freelances",
    messages: "Messages",
    favorites: "Favoris",
    myProfile: "Mon Profil",
    mySubscription: "Mon Abonnement",
    viewPlans: "Voir les Plans",
    administration: "Administration",
    logout: "Déconnexion",
    search: "Rechercher...",
    allCategories: "Toutes les Catégories",
    allProvinces: "Toutes les Provinces",
    allCities: "Toutes les Villes",
    filters: "Filtres",
    freelancersAvailable: "freelances disponibles",
    verifiedProfessionals: "Professionnels vérifiés avec abonnement actif",
    loading: "Chargement...",
    noResults: "Aucun résultat trouvé",
    tryDifferentFilters: "Essayez d'ajuster les filtres ou de rechercher avec d'autres termes",
    viewAll: "Voir Tout",
    heroTitle: "Trouvez le Professionnel Parfait",
    heroSubtitle: "Des milliers de freelances vérifiés prêts à vous aider",
    chooseHow: "Comment voulez-vous utiliser MilAutónomos?",
    imFreelancer: "Je suis Freelance",
    imClient: "Je suis Client",
    
    // Categories
    "Electricista": "Électricien",
    "Carpintero": "Charpentier",
    "Fontanero": "Plombier",
    "Albañil / Reformas": "Maçon / Rénovations",
    "Pintor": "Peintre",
    "Jardinero": "Jardinier",
    "Transportista": "Chauffeur / Transport",
    "Autónomo de limpieza": "Professionnel du Nettoyage",
    "Cerrajero": "Serrurier",
    "Instalador de aire acondicionado": "Installateur de Climatisation",
    "Mantenimiento general": "Entretien Général",
    
    // Footer
    tagline: "Votre freelance de confiance",
    platformDescription: "Nous connectons des professionnels freelances avec des clients qui ont besoin de leurs services.",
    forProfessionals: "Pour les Professionnels",
    plansAndPricing: "Plans et Tarifs",
    createProfile: "Créer un Profil",
    joinAdvantages: "Avantages de Rejoindre",
    helpCenter: "Centre d'Aide",
    forClients: "Pour les Clients",
    createFreeAccount: "Créer un Compte Gratuit",
    faq: "FAQ",
    contact: "Contact",
    allRightsReserved: "Tous droits réservés",
    privacyPolicy: "Politique de Confidentialité",
    termsConditions: "Conditions Générales",
    cookiePolicy: "Politique des Cookies",
    legalNotice: "Mention Légale",
    
    // Cookies
    cookieTitle: "Nous utilisons des cookies",
    cookieText: "Nous utilisons des cookies pour améliorer votre expérience. Consultez notre",
    onlyNecessary: "Rejeter",
    acceptAll: "Accepter tout",
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'es';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLang.flag} {currentLang.name}</span>
          <span className="sm:hidden">{currentLang.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? 'bg-blue-50' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}