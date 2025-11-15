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
    // ============ ROLES Y TIPOS ============
    'Autónomo': 'Autónomo',
    'Cliente': 'Cliente',
    freelancer: 'Autónomo',
    client: 'Cliente',
    professional: 'Autónomo',
    userType: 'Tipo de usuario',
    accountType: 'Tipo de cuenta',
    
    // ============ NAVEGACIÓN ============
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
    navigation: 'Navegación',
    openMenu: 'Abrir menú',
    profilePicture: 'Foto de perfil',
    
    // ============ HERO ============
    heroTitle: 'Encuentra tu autónomo de confianza',
    heroSubtitle: 'Conecta con profesionales verificados cerca de ti. Rápido, fácil y seguro.',
    chooseHow: '¿Cómo quieres usar MisAutónomos?',
    imFreelancer: 'Soy autónomo',
    imClient: 'Busco servicios',
    
    // ============ BÚSQUEDA ============
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
    discoverFreelancers: 'Descubrir autónomos',
    
    // ============ CATEGORÍAS ============
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
    
    // ============ PERFIL PROFESIONAL ============
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
    
    // ============ REVIEWS ============
    reviewsTitle: 'Opiniones de clientes',
    noReviewsYet: 'Sin opiniones por ahora',
    beFirstReview: 'Sé el primero en dejar una opinión',
    speed: 'Rapidez',
    communication: 'Comunicación',
    quality: 'Calidad',
    priceSatisfaction: 'Precio/Satisfacción',
    reportReview: 'Reportar opinión',
    inappropriate: 'Contenido inapropiado',
    rapidez: 'Rapidez',
    comunicacion: 'Comunicación',
    calidadTrabajo: 'Calidad del trabajo',
    relacionCalidadPrecio: 'Relación calidad/precio',
    
    // ============ MENSAJERÍA ============
    conversations: 'Conversaciones',
    noConversations: 'No hay conversaciones',
    startChatting: 'Comienza a chatear con profesionales',
    writeMessage: 'Escribe un mensaje...',
    send: 'Enviar',
    loadingMessages: 'Cargando mensajes...',
    user: 'Usuario',
    you: 'Tú',
    online: 'En línea',
    selectConversation: 'Selecciona una conversación',
    chooseContactToChat: 'Elige un contacto para comenzar a chatear',
    enterToSend: 'Presiona Enter para enviar, Shift+Enter para nueva línea',
    messageSent: 'Mensaje enviado',
    sendMessageError: 'Error al enviar el mensaje',
    prepareMessageError: 'Error al preparar el mensaje: ',
    contactProfessionalToStart: 'Contacta con un profesional para empezar',
    messagesPageDescription: 'Gestiona tus conversaciones con profesionales',
    noMessagesInConversation: 'No hay mensajes en esta conversación',
    loadingMessaging: 'Cargando mensajes...',
    
    // ============ REVIEWS DIALOG ============
    rateServiceOf: 'Valorar el servicio de {{name}}',
    reviewHelpfulDescription: 'Tu opinión ayuda a otros clientes a tomar decisiones informadas',
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
    
    // ============ FAVORITOS ============
    myFavorites: 'Mis Favoritos',
    noFavorites: 'Aún no tienes favoritos',
    addFavorites: 'Guarda tus profesionales preferidos aquí',
    remove: 'Eliminar',
    contact: 'Contactar',
    manageFavoriteProfessionals: 'Gestiona tus profesionales favoritos',
    addFreelancersToFavorites: 'Guarda profesionales para contactarlos más tarde',
    favoriteProfessionalsSubtitle: 'Tus autónomos guardados',
    
    // ============ MI PERFIL ============
    manageProfile: 'Gestiona tu información',
    manageProfessionalProfile: 'Gestiona tu perfil profesional',
    editProfile: 'Editar Perfil',
    visibleToClients: 'Visible para clientes',
    hiddenProfile: 'Perfil oculto',
    saveChanges: 'Guardar cambios',
    saving: 'Guardando...',
    personalInfo: 'Información personal',
    professionalProfile: 'Perfil Profesional',
    portfolio: 'Portfolio',
    fullName: 'Nombre completo',
    city: 'Ciudad',
    changePhoto: 'Cambiar foto',
    professionalIdentity: 'Identidad Profesional',
    professionalName: 'Nombre profesional',
    yearsExperience: 'Años de experiencia',
    emailContact: 'Email de contacto',
    phoneContact: 'Teléfono de contacto',
    certifications: 'Certificaciones y títulos',
    addCertification: 'Añadir certificación',
    servicesDescription: 'Servicios y Descripción',
    serviceCategories: 'Categorías de servicio',
    specifyService: 'Especifica tu servicio',
    shortDescription: 'Descripción corta',
    detailedDescription: 'Descripción detallada',
    locationAvailability: 'Ubicación y Disponibilidad',
    province: 'Provincia',
    neighborhood: 'Barrio/Municipio',
    serviceRadius: 'Radio de servicio',
    availability: 'Disponibilidad',
    startTime: 'Hora inicio',
    endTime: 'Hora fin',
    ratesPayment: 'Tarifas y Forma de Trabajo',
    baseRate: 'Tarifa base',
    invoiceType: 'Tipo de facturación',
    paymentMethods: 'Formas de pago aceptadas',
    onlinePresence: 'Presencia Online',
    workGalleryTitle: 'Galería de Trabajos',
    uploadPhotos: 'Sube fotos de tus trabajos',
    addPhoto: 'Añadir foto',
    mainPhoto: 'Principal',
    dangerZone: 'Zona de peligro',
    deleteAccount: 'Eliminar mi cuenta',
    deleteAccountWarning: 'Esta acción eliminará permanentemente tu cuenta',
    confirmDelete: 'Sí, eliminar definitivamente',
    deleteAccountConfirm: '¿Eliminar tu cuenta definitivamente?',
    warningIrreversible: 'ATENCIÓN: Esta acción es IRREVERSIBLE',
    willBeDeleted: 'Se eliminará permanentemente',
    accountAndProfile: 'Tu cuenta y perfil completo',
    allMessages: 'Todos tus mensajes y conversaciones',
    favoritesAndReviews: 'Tus favoritos y reseñas',
    professionalProfilePhotos: 'Tu perfil profesional y fotos',
    activeSubscription: 'Tu suscripción activa',
    deleting: 'Eliminando...',
    wantToOfferServices: '¿Quieres ofrecer tus servicios?',
    becomeFreelancerDescription: 'Conviértete en autónomo y aparece en las búsquedas de clientes',
    optional: 'opcional',
    selectProvince: 'Selecciona provincia',
    onlyMyArea: 'Solo mi zona',
    metroArea: 'Área metropolitana',
    multipleProvinces: 'Múltiples provincias',
    company: 'Sociedad',
    other: 'Otros',
    Tarjeta: 'Tarjeta',
    Transferencia: 'Transferencia',
    Efectivo: 'Efectivo',
    Bizum: 'Bizum',
    
    // ============ SUSCRIPCIÓN ============
    manageSubscription: 'Gestiona tu plan profesional',
    backToProfile: 'Volver a Mi Perfil',
    noActiveSubscription: 'Sin suscripción activa',
    needSubscription: 'Necesitas contratar un plan profesional para que tu perfil aparezca en las búsquedas',
    currentPlan: 'Plan actual',
    startDate: 'Fecha de inicio',
    renewalExpiration: 'Renovación / Expiración',
    daysRemaining: 'días restantes',
    days: 'días',
    profileVisible: 'Tu perfil es visible para todos los clientes. Todo en orden.',
    trialActive: 'Periodo de prueba activa. Tu perfil es visible para clientes.',
    subscriptionCanceled: 'Suscripción cancelada',
    subscriptionEnded: 'Suscripción finalizada. Tu perfil ya no es visible.',
    improvePlan: 'Mejora tu plan',
    reactivatePlan: 'Reactiva tu plan',
    cancelSubscription: 'Cancelar suscripción',
    changePlan: 'Cambiar plan',
    viewAllPlans: 'Ver todos los planes',
    cancelConfirm: '¿Cancelar suscripción?',
    keepActive: 'No, mantener activo',
    yesCancelSubscription: 'Sí, cancelar suscripción',
    canceling: 'Cancelando...',
    active: 'Activo',
    canceled: 'Cancelado',
    ended: 'Finalizado',
    trial: 'Prueba',
    planInformation: 'Información de tu plan',
    verifying: 'Verificando',
    verifyPayment: 'Verificar pago',
    saveUpTo138: 'Ahorra hasta 138€/año cambiando a plan trimestral o anual',
    viewSuperiorPlans: 'Ver planes superiores',
    appearInSearches: 'Vuelve a aparecer en las búsquedas y recibe nuevos clientes',
    cancelSubscriptionDesc: 'Tu perfil dejará de aparecer en las búsquedas inmediatamente',
    explorePlans: 'Explora otros planes que se adapten mejor a tus necesidades',
    ifYouCancel: 'Si cancelas tu suscripción',
    noCharge: 'NO se te cobrará nada (tu prueba gratuita se cancela)',
    profileHiddenImmediately: 'Tu perfil dejará de aparecer inmediatamente',
    canReactivate: 'Puedes reactivar en cualquier momento con otro plan',
    profileWillBeHidden: 'Tu perfil dejará de aparecer en las búsquedas inmediatamente',
    noNewContacts: 'No recibirás nuevos contactos de clientes',
    accessUntil: 'Mantendrás acceso a tu cuenta hasta el {{date}}',
    canReactivateAnytime: 'Podrás reactivar tu suscripción en cualquier momento',
    confirmAction: '¿Estás seguro que deseas continuar?',
    activeUntil: 'Activo hasta {{date}} (no se renovará)',
    
    // ============ FOOTER ============
    tagline: 'Tu autónomo de confianza',
    platformDescription: 'Conectamos profesionales con clientes en toda España',
    forProfessionals: 'Para Profesionales',
    forClients: 'Para Clientes',
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
    
    // ============ COMUNES ============
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
    accept: 'Aceptar',
    yes: 'Sí',
    no: 'No',
  },
  en: {
    // ============ ROLES Y TIPOS ============
    'Autónomo': 'Freelancer',
    'Cliente': 'Client',
    freelancer: 'Freelancer',
    client: 'Client',
    professional: 'Professional',
    userType: 'User type',
    accountType: 'Account type',
    
    // ============ NAVEGACIÓN ============
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
    navigation: 'Navigation',
    openMenu: 'Open menu',
    profilePicture: 'Profile picture',
    
    // ============ HERO ============
    heroTitle: 'Find your trusted professional',
    heroSubtitle: 'Connect with verified professionals near you. Fast, easy and secure.',
    chooseHow: 'How do you want to use MisAutónomos?',
    imFreelancer: "I'm a professional",
    imClient: 'I need services',
    
    // ============ BÚSQUEDA ============
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
    discoverFreelancers: 'Discover professionals',
    
    // ============ CATEGORÍAS ============
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
    
    // ============ PERFIL PROFESIONAL ============
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
    
    // ============ REVIEWS ============
    reviewsTitle: 'Client reviews',
    noReviewsYet: 'No reviews yet',
    beFirstReview: 'Be the first to leave a review',
    speed: 'Speed',
    communication: 'Communication',
    quality: 'Quality',
    priceSatisfaction: 'Price/Satisfaction',
    reportReview: 'Report review',
    inappropriate: 'Inappropriate content',
    rapidez: 'Speed',
    comunicacion: 'Communication',
    calidadTrabajo: 'Work quality',
    relacionCalidadPrecio: 'Value for money',
    
    // ============ MENSAJERÍA ============
    conversations: 'Conversations',
    noConversations: 'No conversations',
    startChatting: 'Start chatting with professionals',
    writeMessage: 'Write a message...',
    send: 'Send',
    loadingMessages: 'Loading messages...',
    user: 'User',
    you: 'You',
    online: 'Online',
    selectConversation: 'Select a conversation',
    chooseContactToChat: 'Choose a contact to start chatting',
    enterToSend: 'Press Enter to send, Shift+Enter for new line',
    messageSent: 'Message sent',
    sendMessageError: 'Error sending message',
    prepareMessageError: 'Error preparing message: ',
    contactProfessionalToStart: 'Contact a professional to start',
    messagesPageDescription: 'Manage your conversations with professionals',
    noMessagesInConversation: 'No messages in this conversation',
    loadingMessaging: 'Loading messages...',
    
    // ============ REVIEWS DIALOG ============
    rateServiceOf: 'Rate service from {{name}}',
    reviewHelpfulDescription: 'Your review helps other clients make informed decisions',
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
    
    // ============ FAVORITOS ============
    myFavorites: 'My Favorites',
    noFavorites: 'No favorites yet',
    addFavorites: 'Save your preferred professionals here',
    remove: 'Remove',
    contact: 'Contact',
    manageFavoriteProfessionals: 'Manage your favorite professionals',
    addFreelancersToFavorites: 'Save professionals to contact them later',
    favoriteProfessionalsSubtitle: 'Your saved professionals',
    
    // ============ MI PERFIL ============
    manageProfile: 'Manage your information',
    manageProfessionalProfile: 'Manage your professional profile',
    editProfile: 'Edit Profile',
    visibleToClients: 'Visible to clients',
    hiddenProfile: 'Hidden profile',
    saveChanges: 'Save changes',
    saving: 'Saving...',
    personalInfo: 'Personal information',
    professionalProfile: 'Professional Profile',
    portfolio: 'Portfolio',
    fullName: 'Full name',
    city: 'City',
    changePhoto: 'Change photo',
    professionalIdentity: 'Professional Identity',
    professionalName: 'Professional name',
    yearsExperience: 'Years of experience',
    emailContact: 'Contact email',
    phoneContact: 'Contact phone',
    certifications: 'Certifications and qualifications',
    addCertification: 'Add certification',
    servicesDescription: 'Services and Description',
    serviceCategories: 'Service categories',
    specifyService: 'Specify your service',
    shortDescription: 'Short description',
    detailedDescription: 'Detailed description',
    locationAvailability: 'Location and Availability',
    province: 'Province',
    neighborhood: 'Neighborhood',
    serviceRadius: 'Service radius',
    availability: 'Availability',
    startTime: 'Start time',
    endTime: 'End time',
    ratesPayment: 'Rates and Payment',
    baseRate: 'Base rate',
    invoiceType: 'Invoice type',
    paymentMethods: 'Accepted payment methods',
    onlinePresence: 'Online Presence',
    workGalleryTitle: 'Work Gallery',
    uploadPhotos: 'Upload photos of your work',
    addPhoto: 'Add photo',
    mainPhoto: 'Main',
    dangerZone: 'Danger zone',
    deleteAccount: 'Delete my account',
    deleteAccountWarning: 'This action will permanently delete your account',
    confirmDelete: 'Yes, delete permanently',
    deleteAccountConfirm: 'Delete your account permanently?',
    warningIrreversible: 'WARNING: This action is IRREVERSIBLE',
    willBeDeleted: 'Will be permanently deleted',
    accountAndProfile: 'Your account and complete profile',
    allMessages: 'All your messages and conversations',
    favoritesAndReviews: 'Your favorites and reviews',
    professionalProfilePhotos: 'Your professional profile and photos',
    activeSubscription: 'Your active subscription',
    deleting: 'Deleting...',
    wantToOfferServices: 'Want to offer your services?',
    becomeFreelancerDescription: 'Become a professional and appear in client searches',
    optional: 'optional',
    selectProvince: 'Select province',
    onlyMyArea: 'Only my area',
    metroArea: 'Metro area',
    multipleProvinces: 'Multiple provinces',
    company: 'Company',
    other: 'Other',
    Tarjeta: 'Card',
    Transferencia: 'Transfer',
    Efectivo: 'Cash',
    Bizum: 'Bizum',
    
    // ============ SUSCRIPCIÓN ============
    manageSubscription: 'Manage your professional plan',
    backToProfile: 'Back to My Profile',
    noActiveSubscription: 'No active subscription',
    needSubscription: 'You need a professional plan for your profile to appear in searches',
    currentPlan: 'Current plan',
    startDate: 'Start date',
    renewalExpiration: 'Renewal / Expiration',
    daysRemaining: 'days remaining',
    days: 'days',
    profileVisible: 'Your profile is visible to all clients. Everything is in order.',
    trialActive: 'Free trial active. Your profile is visible to clients.',
    subscriptionCanceled: 'Subscription canceled',
    subscriptionEnded: 'Subscription ended. Your profile is no longer visible.',
    improvePlan: 'Upgrade your plan',
    reactivatePlan: 'Reactivate your plan',
    cancelSubscription: 'Cancel subscription',
    changePlan: 'Change plan',
    viewAllPlans: 'View all plans',
    cancelConfirm: 'Cancel subscription?',
    keepActive: 'No, keep active',
    yesCancelSubscription: 'Yes, cancel subscription',
    canceling: 'Canceling...',
    active: 'Active',
    canceled: 'Canceled',
    ended: 'Ended',
    trial: 'Trial',
    planInformation: 'Your plan information',
    verifying: 'Verifying',
    verifyPayment: 'Verify payment',
    saveUpTo138: 'Save up to €138/year switching to quarterly or annual plan',
    viewSuperiorPlans: 'View premium plans',
    appearInSearches: 'Appear in searches again and receive new clients',
    cancelSubscriptionDesc: 'Your profile will stop appearing in searches immediately',
    explorePlans: 'Explore other plans that better suit your needs',
    ifYouCancel: 'If you cancel your subscription',
    noCharge: 'NO charge will be made (your free trial cancels)',
    profileHiddenImmediately: 'Your profile will stop appearing immediately',
    canReactivate: 'You can reactivate anytime with another plan',
    profileWillBeHidden: 'Your profile will stop appearing in searches immediately',
    noNewContacts: 'You will not receive new client contacts',
    accessUntil: 'You will maintain access to your account until {{date}}',
    canReactivateAnytime: 'You can reactivate your subscription at any time',
    confirmAction: 'Are you sure you want to continue?',
    activeUntil: 'Active until {{date}} (will not renew)',
    
    // ============ FOOTER ============
    tagline: 'Your trusted professional',
    platformDescription: 'Connecting professionals with clients across Spain',
    forProfessionals: 'For Professionals',
    forClients: 'For Clients',
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
    
    // ============ COMUNES ============
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
    accept: 'Accept',
    yes: 'Yes',
    no: 'No',
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