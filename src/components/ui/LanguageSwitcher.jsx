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
    searchFreelancers: 'Buscar Autónomos',
    messages: 'Mensajes',
    favorites: 'Favoritos',
    myProfile: 'Mi Perfil',
    mySubscription: 'Mi Suscripción',
    administration: 'Administración',
    viewPlans: 'Ver Planes',
    logout: 'Cerrar sesión',
    login: 'Iniciar sesión',
    becomeFreelancer: 'Hazte autónomo',
    
    // Hero
    heroTitle: 'Encuentra tu autónomo de confianza',
    heroSubtitle: 'Conecta con profesionales verificados cerca de ti. Rápido, fácil y seguro.',
    chooseHow: '¿Cómo quieres usar MisAutónomos?',
    imFreelancer: 'Soy autónomo',
    imClient: 'Busco servicios',
    
    // Search
    filters: 'Filtros de búsqueda',
    search: 'Buscar servicio, empresa...',
    allCategories: 'Todas las categorías',
    allProvinces: 'Todas las provincias',
    allCities: 'Todas las ciudades',
    freelancersAvailable: 'autónomos disponibles',
    verifiedProfessionals: 'Profesionales verificados',
    noResults: 'No se encontraron resultados',
    tryDifferentFilters: 'Intenta con otros filtros o busca en otra ubicación',
    viewAll: 'Ver todos',
    
    // Categories
    'Electricista': 'Electricista',
    'Fontanero': 'Fontanero',
    'Carpintero': 'Carpintero',
    'Albañil / Reformas': 'Albañil / Reformas',
    'Pintor': 'Pintor',
    'Jardinero': 'Jardinero',
    'Transportista': 'Transportista',
    'Autónomo de limpieza': 'Autónomo de limpieza',
    'Cerrajero': 'Cerrajero',
    'Instalador de aire acondicionado': 'Instalador de aire acondicionado',
    'Mantenimiento general': 'Mantenimiento general',
    'Asesoría o gestoría': 'Asesoría o gestoría',
    'Empresa multiservicios': 'Empresa multiservicios',
    'Otro tipo de servicio profesional': 'Otro tipo de servicio',
    
    // Cards & Profile
    verified: 'Verificado',
    availableNow: 'Disponible ahora',
    until: 'Hasta las',
    call: 'Llamar',
    whatsapp: 'WhatsApp',
    chat: 'Chat directo',
    workArea: 'Zona de trabajo',
    hourRate: 'Tarifa media',
    noOpinions: 'Sin opiniones aún',
    workGallery: 'Galería de Trabajos',
    reviews: 'opiniones',
    review: 'opinión',
    information: 'Información',
    schedule: 'Horario',
    mondayFriday: 'Lunes a Viernes',
    weekends: 'Sábados, domingos y festivos',
    everyday: 'Todos los días',
    averageRate: 'Tarifa media',
    email: 'Email',
    phone: 'Teléfono',
    website: 'Sitio web',
    visitWebsite: 'Visitar sitio web',
    
    // Reviews
    reviewsTitle: 'Opiniones de clientes',
    noReviewsYet: 'Sin opiniones por ahora',
    beFirstReview: 'Sé el primero en dejar una opinión',
    speed: 'Rapidez',
    communication: 'Comunicación',
    quality: 'Calidad',
    priceSatisfaction: 'Precio/Satisfacción',
    reportReview: 'Reportar opinión',
    inappropriate: 'Contenido inapropiado',
    
    // Messages
    conversations: 'Conversaciones',
    noConversations: 'No hay conversaciones',
    startChatting: 'Comienza a chatear con profesionales',
    writeMessage: 'Escribe un mensaje...',
    send: 'Enviar',
    loadingMessages: 'Cargando mensajes...',
    user: 'Usuario',
    you: 'Tú',
    professional: 'Autónomo',
    client: 'Cliente',
    online: 'En línea',
    selectConversation: 'Selecciona una conversación',
    chooseContactToChat: 'Elige un contacto para comenzar a chatear',
    enterToSend: 'Presiona Enter para enviar, Shift+Enter para nueva línea',
    messageSent: 'Mensaje enviado',
    sendMessageError: 'Error al enviar el mensaje',
    prepareMessageError: 'Error al preparar el mensaje: ',
    
    // Review Dialog
    rateServiceOf: 'Valorar el servicio de {{name}}',
    reviewHelpfulDescription: 'Tu opinión ayuda a otros clientes a tomar decisiones informadas',
    rapidez: 'Rapidez',
    comunicacion: 'Comunicación',
    calidadTrabajo: 'Calidad del trabajo',
    relacionCalidadPrecio: 'Relación calidad/precio',
    tellExperienceOptional: 'Cuéntanos tu experiencia (opcional)',
    experiencePlaceholder: 'Describe tu experiencia con este profesional...',
    characters: 'caracteres',
    tip: 'Consejo',
    honestReviewsHelpful: 'Las valoraciones honestas son las más útiles para la comunidad',
    warning: 'Aviso',
    alreadyReviewedMessage: 'Ya has valorado a este profesional anteriormente',
    rateAllAspects: 'Por favor, valora todos los aspectos',
    commentMinLength: 'El comentario debe tener al menos 10 caracteres',
    reviewSuccess: 'Valoración publicada correctamente',
    alreadyReviewed: 'Ya has valorado este servicio',
    reviewError: 'Error al publicar la valoración',
    alreadyReviewedInfo: 'Ya has valorado a este profesional',
    bidirectionalConversationRequired: 'Solo puedes valorar después de recibir una respuesta',
    cannotLeaveReviewNow: 'No puedes dejar una valoración ahora',
    sending: 'Enviando...',
    publishReview: 'Publicar valoración',
    noMessagesInConversation: 'No hay mensajes en esta conversación',
    contactProfessionalToStart: 'Contacta con un profesional para empezar',
    loadingMessaging: 'Cargando mensajes...',
    messagesPageDescription: 'Gestiona tus conversaciones con profesionales',
    
    // Favorites
    myFavorites: 'Mis Favoritos',
    noFavorites: 'Aún no tienes favoritos',
    addFavorites: 'Guarda tus profesionales preferidos aquí',
    remove: 'Eliminar',
    contact: 'Contactar',
    
    // Footer
    tagline: 'Tu autónomo de confianza',
    platformDescription: 'Conectamos profesionales con clientes en toda España',
    forProfessionals: 'Para Profesionales',
    forClients: 'Para Clientes',
    navigation: 'Navegación',
    legal: 'Legal',
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
    allRightsReserved: 'Todos los derechos reservados',
    
    // Common
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    back: 'Volver',
    next: 'Siguiente',
    previous: 'Anterior',
    confirm: 'Confirmar',
    close: 'Cerrar',
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
    
    // Hero
    heroTitle: 'Find your trusted professional',
    heroSubtitle: 'Connect with verified professionals near you. Fast, easy and secure.',
    chooseHow: 'How do you want to use MisAutónomos?',
    imFreelancer: "I'm a professional",
    imClient: 'I need services',
    
    // Search
    filters: 'Search filters',
    search: 'Search service, company...',
    allCategories: 'All categories',
    allProvinces: 'All provinces',
    allCities: 'All cities',
    freelancersAvailable: 'professionals available',
    verifiedProfessionals: 'Verified professionals',
    noResults: 'No results found',
    tryDifferentFilters: 'Try different filters or search in another location',
    viewAll: 'View all',
    
    // Categories
    'Electricista': 'Electrician',
    'Fontanero': 'Plumber',
    'Carpintero': 'Carpenter',
    'Albañil / Reformas': 'Mason / Renovations',
    'Pintor': 'Painter',
    'Jardinero': 'Gardener',
    'Transportista': 'Carrier',
    'Autónomo de limpieza': 'Cleaning Service',
    'Cerrajero': 'Locksmith',
    'Instalador de aire acondicionado': 'AC Installer',
    'Mantenimiento general': 'General Maintenance',
    'Asesoría o gestoría': 'Consulting',
    'Empresa multiservicios': 'Multi-service',
    'Otro tipo de servicio profesional': 'Other service',
    
    // Cards & Profile
    verified: 'Verified',
    availableNow: 'Available now',
    until: 'Until',
    call: 'Call',
    whatsapp: 'WhatsApp',
    chat: 'Direct chat',
    workArea: 'Work area',
    hourRate: 'Average rate',
    noOpinions: 'No reviews yet',
    workGallery: 'Work Gallery',
    reviews: 'reviews',
    review: 'review',
    information: 'Information',
    schedule: 'Schedule',
    mondayFriday: 'Monday to Friday',
    weekends: 'Weekends & Holidays',
    everyday: 'Every day',
    averageRate: 'Average rate',
    email: 'Email',
    phone: 'Phone',
    website: 'Website',
    visitWebsite: 'Visit website',
    
    // Reviews
    reviewsTitle: 'Client reviews',
    noReviewsYet: 'No reviews yet',
    beFirstReview: 'Be the first to leave a review',
    speed: 'Speed',
    communication: 'Communication',
    quality: 'Quality',
    priceSatisfaction: 'Price/Satisfaction',
    reportReview: 'Report review',
    inappropriate: 'Inappropriate content',
    
    // Messages
    conversations: 'Conversations',
    noConversations: 'No conversations',
    startChatting: 'Start chatting with professionals',
    writeMessage: 'Write a message...',
    send: 'Send',
    loadingMessages: 'Loading messages...',
    user: 'User',
    you: 'You',
    professional: 'Professional',
    client: 'Client',
    online: 'Online',
    selectConversation: 'Select a conversation',
    chooseContactToChat: 'Choose a contact to start chatting',
    enterToSend: 'Press Enter to send, Shift+Enter for new line',
    messageSent: 'Message sent',
    sendMessageError: 'Error sending message',
    prepareMessageError: 'Error preparing message: ',
    
    // Review Dialog
    rateServiceOf: 'Rate service from {{name}}',
    reviewHelpfulDescription: 'Your review helps other clients make informed decisions',
    rapidez: 'Speed',
    comunicacion: 'Communication',
    calidadTrabajo: 'Work quality',
    relacionCalidadPrecio: 'Value for money',
    tellExperienceOptional: 'Tell us about your experience (optional)',
    experiencePlaceholder: 'Describe your experience with this professional...',
    characters: 'characters',
    tip: 'Tip',
    honestReviewsHelpful: 'Honest reviews are the most helpful for the community',
    warning: 'Warning',
    alreadyReviewedMessage: 'You have already reviewed this professional',
    rateAllAspects: 'Please rate all aspects',
    commentMinLength: 'Comment must be at least 10 characters',
    reviewSuccess: 'Review published successfully',
    alreadyReviewed: 'Already reviewed',
    reviewError: 'Error publishing review',
    alreadyReviewedInfo: 'You have already reviewed this professional',
    bidirectionalConversationRequired: 'You can only review after receiving a response',
    cannotLeaveReviewNow: 'Cannot leave a review now',
    sending: 'Sending...',
    publishReview: 'Publish review',
    noMessagesInConversation: 'No messages in this conversation',
    contactProfessionalToStart: 'Contact a professional to start',
    loadingMessaging: 'Loading messages...',
    messagesPageDescription: 'Manage your conversations with professionals',
    
    // Favorites
    myFavorites: 'My Favorites',
    noFavorites: 'No favorites yet',
    addFavorites: 'Save your preferred professionals here',
    remove: 'Remove',
    contact: 'Contact',
    
    // Footer
    tagline: 'Your trusted professional',
    platformDescription: 'Connecting professionals with clients across Spain',
    forProfessionals: 'For Professionals',
    forClients: 'For Clients',
    navigation: 'Navigation',
    legal: 'Legal',
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
    allRightsReserved: 'All rights reserved',
    
    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    confirm: 'Confirm',
    close: 'Close',
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

  const t = (key, params = {}) => {
    let text = translations[language]?.[key] || translations.es[key] || key;
    
    Object.keys(params).forEach(param => {
      text = text.replace(`{{${param}}}`, params[param]);
    });
    
    return text;
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