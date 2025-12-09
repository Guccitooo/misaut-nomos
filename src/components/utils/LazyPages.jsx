import { lazy } from 'react';

// Páginas principales - cargar inmediatamente
export const Search = lazy(() => import('@/pages/Search'));
export const Messages = lazy(() => import('@/pages/Messages'));

// Páginas de autenticación y onboarding
export const UserTypeSelection = lazy(() => import('@/pages/UserTypeSelection'));
export const ClientOnboarding = lazy(() => import('@/pages/ClientOnboarding'));
export const ProfileOnboarding = lazy(() => import('@/pages/ProfileOnboarding'));
export const Onboarding = lazy(() => import('@/pages/Onboarding'));

// Páginas de perfil
export const MyProfile = lazy(() => import('@/pages/MyProfile'));
export const ProfessionalProfile = lazy(() => import('@/pages/ProfessionalProfile'));
export const Autonomo = lazy(() => import('@/pages/Autonomo'));

// Suscripciones y pagos
export const PricingPlans = lazy(() => import('@/pages/PricingPlans'));
export const SubscriptionManagement = lazy(() => import('@/pages/SubscriptionManagement'));
export const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));

// Funcionalidades profesionales
export const ProfessionalDashboard = lazy(() => import('@/pages/ProfessionalDashboard'));
export const Calendar = lazy(() => import('@/pages/Calendar'));
export const CRM = lazy(() => import('@/pages/CRM'));
export const ClientDetail = lazy(() => import('@/pages/ClientDetail'));
export const Jobs = lazy(() => import('@/pages/Jobs'));
export const Invoices = lazy(() => import('@/pages/Invoices'));
export const PayInvoice = lazy(() => import('@/pages/PayInvoice'));
export const Projects = lazy(() => import('@/pages/Projects'));
export const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'));
export const CRMAutomations = lazy(() => import('@/pages/CRMAutomations'));

// Favoritos y presupuestos
export const Favorites = lazy(() => import('@/pages/Favorites'));
export const QuoteRequests = lazy(() => import('@/pages/QuoteRequests'));
export const RequestQuote = lazy(() => import('@/pages/RequestQuote'));

// Tickets y soporte
export const Tickets = lazy(() => import('@/pages/Tickets'));
export const TicketDetail = lazy(() => import('@/pages/TicketDetail'));
export const AdminTickets = lazy(() => import('@/pages/AdminTickets'));

// Admin y categorías
export const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
export const AdminFAQ = lazy(() => import('@/pages/AdminFAQ'));
export const Categoria = lazy(() => import('@/pages/Categoria'));

// Información y ayuda
export const FAQ = lazy(() => import('@/pages/FAQ'));
export const FAQDetail = lazy(() => import('@/pages/FAQDetail'));
export const HelpCenter = lazy(() => import('@/pages/HelpCenter'));
export const Notifications = lazy(() => import('@/pages/Notifications'));

// Legales
export const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
export const TermsConditions = lazy(() => import('@/pages/TermsConditions'));
export const CookiePolicy = lazy(() => import('@/pages/CookiePolicy'));
export const LegalNotice = lazy(() => import('@/pages/LegalNotice'));

// Dashboard Pro Info
export const DashboardProInfo = lazy(() => import('@/pages/DashboardProInfo'));