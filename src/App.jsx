import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { AppProvider } from '@/lib/AppContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Suspense, lazy, React, Component } from 'react';

// ErrorBoundary para capturar errores en producción
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleLogout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-red-100 p-6 shadow-lg">
            <h2 className="font-semibold text-gray-900 text-lg">Algo salió mal</h2>
            <p className="text-sm text-gray-500 mt-2">Por favor, recarga la página o intenta de nuevo.</p>
            
            {/* MOSTRAR ERROR REAL - TEMPORAL PARA DEBUGGING */}
            {this.state.error && (
              <details className="mt-4 bg-red-50 rounded-lg p-3 text-xs">
                <summary className="font-medium text-red-900 cursor-pointer">Ver detalles del error</summary>
                <pre className="mt-2 overflow-auto text-red-800 whitespace-pre-wrap max-h-64">
                  {this.state.error.message || 'Error desconocido'}
                  {'\n\n'}
                  {this.state.error.stack?.split('\n').slice(0, 8).join('\n')}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => window.location.reload()} 
                className="flex-1 bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 transition"
              >
                Recargar
              </button>
              <button 
                onClick={() => { window.location.href = '/'; }} 
                className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-200 transition"
              >
                Ir al inicio
              </button>
              <button 
                onClick={this.handleLogout} 
                className="flex-1 bg-red-50 text-red-700 text-sm font-medium py-2.5 rounded-lg hover:bg-red-100 transition"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy load de páginas pesadas (admin, invoicing, CRM)
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminPayments = lazy(() => import('./pages/AdminPayments'));
const AdminTickets = lazy(() => import('./pages/AdminTickets'));
const AdminFAQ = lazy(() => import('./pages/AdminFAQ'));
const AdminMessagesStats = lazy(() => import('./pages/AdminMessagesStats'));
const AdminSupport = lazy(() => import('./pages/AdminSupport'));
const AdminNewsletter = lazy(() => import('./pages/AdminNewsletter'));
const AdminReferrals = lazy(() => import('./pages/AdminReferrals'));
const AdminGifts = lazy(() => import('./pages/AdminGifts'));
const AdminEmails = lazy(() => import('./pages/AdminEmails'));
const EmailUnsubscribe = lazy(() => import('./pages/EmailUnsubscribe'));
const SEOAnalysis = lazy(() => import('./pages/SEOAnalysis'));
const BlogList = lazy(() => import('./pages/BlogList'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const AdminBlog = lazy(() => import('./pages/AdminBlog'));
const Invoices = lazy(() => import('./pages/Invoices'));
const MisClientes = lazy(() => import('./pages/MisClientes'));
const CRMAutomations = lazy(() => import('./pages/CRMAutomations'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Jobs = lazy(() => import('./pages/Jobs'));
const SupportChat = lazy(() => import('./pages/SupportChat.jsx'));
const MiCampana = lazy(() => import('./pages/MiCampana'));
const BriefingMensual = lazy(() => import('./pages/BriefingMensual'));
const PlanAds = lazy(() => import('./pages/PlanAds'));
const AcceptQuote = lazy(() => import('./pages/AcceptQuote'));
const LeaveReview = lazy(() => import('./pages/LeaveReview'));

// Sin spinner de carga — renderizar directamente
const PageLoader = () => null;

const { Pages, Layout } = pagesConfig;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// ===== MAPA DE RUTAS ANTIGUAS → NUEVAS (redirect 301-style) =====
// Toda URL antigua tipo /Search, /PricingPlans, etc. redirige a la versión ES.
const LEGACY_REDIRECTS = {
  '/search': '/buscar',
  '/autonomo': '/autonomo',
  '/categoria': '/categoria',
  '/pricingplans': '/precios',
  '/faq': '/preguntas-frecuentes',
  '/faqdetail': '/preguntas-frecuentes',
  '/helpcenter': '/ayuda',
  '/home': '/inicio',
  '/clientonboarding': '/registro-cliente',
  '/usertypeselection': '/registro',
  '/privacypolicy': '/privacidad',
  '/termsconditions': '/terminos',
  '/cookiepolicy': '/cookies',
  '/legalnotice': '/aviso-legal',
  '/messages': '/mensajes',
  '/favorites': '/favoritos',
  '/myprofile': '/mi-perfil',
  '/tickets': '/soporte',
  '/ticketdetail': '/soporte',
  '/presupuestos': '/presupuestos',
  '/requestquote': '/pedir-presupuesto',
  '/quoterequests': '/solicitudes',
  '/notifications': '/notificaciones',
  '/professionaldashboard': '/dashboard',
  '/professionalprofile': '/perfil',
  '/profileonboarding': '/completar-perfil',
  '/projects': '/proyectos',
  '/projectdetail': '/proyectos',
  '/calendar': '/calendario',
  '/invoices': '/facturas',
  '/payinvoice': '/pagar',
  '/crm': '/mis-clientes',
  '/crmautomations': '/automatizaciones',
  '/clientdetail': '/clientes',
  '/jobs': '/trabajos',
  '/subscriptionmanagement': '/suscripcion',
  '/paymentsuccess': '/pago-exitoso',
  '/dashboardproinfo': '/dashboard/info',
  '/onboarding': '/bienvenida',
  '/admindashboard': '/admin',
  '/adminpayments': '/admin/pagos',
  '/admintickets': '/admin/soporte',
  '/adminfaq': '/admin/faq',
  '/adminmessagesstats': '/admin/mensajes',
};

// Componente que comprueba si la ruta actual es una URL antigua y redirige.
const LegacyRedirect = () => {
  const location = useLocation();
  const lower = location.pathname.toLowerCase();
  const target = LEGACY_REDIRECTS[lower];
  if (target && target !== location.pathname) {
    return <Navigate to={target + location.search + location.hash} replace />;
  }
  return <PageNotFound />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return null;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <LayoutWrapper currentPageName="Search">
        <Routes>
          {/* Raíz → página principal (búsqueda) */}
          <Route path="/" element={<Pages.Search />} />

          {/* ===== RUTAS PÚBLICAS (ES) ===== */}
          <Route path="/buscar" element={<Pages.Search />} />
          <Route path="/autonomo" element={<Pages.Autonomo />} />
          <Route path="/autonomo/:slug" element={<Pages.Autonomo />} />                {/* legacy: /autonomo/ruben-cardenas-torres */}
          <Route path="/autonomo/:cityCategory/:slug" element={<Pages.Autonomo />} />  {/* SEO: /autonomo/electricista-en-antequera/ruben-cardenas-torres */}
          <Route path="/categoria" element={<Pages.Categoria />} />
          <Route path="/categoria/:slug" element={<Pages.Categoria />} />            {/* legacy: ?name=X&ciudad=Y */}
          <Route path="/categoria/:cityCategory" element={<Pages.Categoria />} />     {/* SEO: /categoria/electricistas-en-antequera */}
          <Route path="/precios" element={<Pages.PricingPlans />} />
          <Route path="/preguntas-frecuentes" element={<Pages.FAQ />} />
          <Route path="/preguntas-frecuentes/:slug" element={<Pages.FAQDetail />} />
          <Route path="/ayuda" element={<Pages.HelpCenter />} />
          <Route path="/inicio" element={<Pages.Home />} />
          <Route path="/registro-cliente" element={<Pages.ClientOnboarding />} />
          <Route path="/registro" element={<Pages.UserTypeSelection />} />
          <Route path="/privacidad" element={<Pages.PrivacyPolicy />} />
          <Route path="/terminos" element={<Pages.TermsConditions />} />
          <Route path="/cookies" element={<Pages.CookiePolicy />} />
          <Route path="/configuracion-cookies" element={<Pages.CookiePreferences />} />
          <Route path="/aviso-legal" element={<Pages.LegalNotice />} />

          {/* ===== RUTAS DE CLIENTE ===== */}
          <Route path="/mensajes" element={<Pages.Messages />} />
          <Route path="/favoritos" element={<Pages.Favorites />} />
          <Route path="/mi-perfil" element={<Pages.MyProfile />} />
          <Route path="/soporte" element={<Suspense fallback={<PageLoader />}><SupportChat /></Suspense>} />
          <Route path="/presupuestos" element={<Pages.Presupuestos />} />
          <Route path="/presupuesto/:quoteId" element={<Suspense fallback={<PageLoader />}><AcceptQuote /></Suspense>} />
          <Route path="/valorar/:professionalId" element={<Suspense fallback={<PageLoader />}><LeaveReview /></Suspense>} />
          <Route path="/pedir-presupuesto" element={<Pages.RequestQuote />} />
          <Route path="/solicitudes" element={<Pages.QuoteRequests />} />
          <Route path="/notificaciones" element={<Pages.Notifications />} />

          {/* ===== RUTAS DE AUTÓNOMO ===== */}
          {/* Importante: /dashboard/info va ANTES que /dashboard para que matchee primero */}
          <Route path="/dashboard/info" element={<Pages.DashboardProInfo />} />
          <Route path="/dashboard" element={<Pages.ProfessionalDashboard />} />
          <Route path="/mis-clientes" element={<Suspense fallback={<PageLoader />}><MisClientes /></Suspense>} />
          <Route path="/visibilidad" element={<Pages.MiVisibilidad />} />
          <Route path="/perfil" element={<Pages.ProfessionalProfile />} />
          <Route path="/perfil/:slug" element={<Pages.ProfessionalProfile />} />
          <Route path="/completar-perfil" element={<Pages.ProfileOnboarding />} />
          <Route path="/proyectos" element={<Suspense fallback={<PageLoader />}><Projects /></Suspense>} />
          <Route path="/proyectos/:id" element={<Suspense fallback={<PageLoader />}><ProjectDetail /></Suspense>} />
          <Route path="/calendario" element={<Suspense fallback={<PageLoader />}><Calendar /></Suspense>} />
          <Route path="/facturas" element={<Suspense fallback={<PageLoader />}><Invoices /></Suspense>} />
          <Route path="/pagar" element={<Pages.PayInvoice />} />
          <Route path="/pagar/:id" element={<Pages.PayInvoice />} />
          {/* /clientes/:id ANTES que /clientes para que matchee primero */}
          <Route path="/clientes/:id" element={<Pages.ClientDetail />} />
          <Route path="/clientes" element={<Suspense fallback={<PageLoader />}><MisClientes /></Suspense>} />
          <Route path="/automatizaciones" element={<Suspense fallback={<PageLoader />}><CRMAutomations /></Suspense>} />
          <Route path="/trabajos" element={<Suspense fallback={<PageLoader />}><Jobs /></Suspense>} />
          <Route path="/suscripcion" element={<Pages.SubscriptionManagement />} />
          <Route path="/pago-exitoso" element={<Pages.PaymentSuccess />} />
          <Route path="/bienvenida" element={<Pages.Onboarding />} />
          
          {/* ===== RUTAS PLAN ADS+ ===== */}
          <Route path="/mi-campana" element={<Suspense fallback={<PageLoader />}><MiCampana /></Suspense>} />
          <Route path="/mi-campana/briefing" element={<Suspense fallback={<PageLoader />}><BriefingMensual /></Suspense>} />
          <Route path="/plan-ads" element={<Suspense fallback={<PageLoader />}><PlanAds /></Suspense>} />

          {/* ===== RUTAS ADMIN ===== */}
          {/* Subrutas admin ANTES que /admin para matchear primero */}
          <Route path="/admin/pagos" element={<Suspense fallback={<PageLoader />}><AdminPayments /></Suspense>} />
          <Route path="/admin/tickets" element={<Suspense fallback={<PageLoader />}><AdminTickets /></Suspense>} />
          <Route path="/admin/soporte" element={<Suspense fallback={<PageLoader />}><AdminSupport /></Suspense>} />
          <Route path="/admin/faq" element={<Suspense fallback={<PageLoader />}><AdminFAQ /></Suspense>} />
          <Route path="/admin/mensajes" element={<Suspense fallback={<PageLoader />}><AdminMessagesStats /></Suspense>} />
          <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
          <Route path="/admin/seo" element={<Suspense fallback={<PageLoader />}><SEOAnalysis /></Suspense>} />
          <Route path="/admin/blog" element={<Suspense fallback={<PageLoader />}><AdminBlog /></Suspense>} />
          <Route path="/admin/newsletter" element={<Suspense fallback={<PageLoader />}><AdminNewsletter /></Suspense>} />
          <Route path="/admin/referidos" element={<Suspense fallback={<PageLoader />}><AdminReferrals /></Suspense>} />
          <Route path="/admin/regalos" element={<Suspense fallback={<PageLoader />}><AdminGifts /></Suspense>} />
          <Route path="/admin/emails" element={<Suspense fallback={<PageLoader />}><AdminEmails /></Suspense>} />
          <Route path="/newsletter/unsubscribe" element={<Suspense fallback={<PageLoader />}><EmailUnsubscribe /></Suspense>} />
          <Route path="/NewsletterUnsubscribe" element={<Suspense fallback={<PageLoader />}><EmailUnsubscribe /></Suspense>} />

          {/* ===== BLOG PÚBLICO ===== */}
          <Route path="/blog" element={<Suspense fallback={<PageLoader />}><BlogList /></Suspense>} />
          <Route path="/blog/:slug" element={<Suspense fallback={<PageLoader />}><BlogPost /></Suspense>} />

          {/* ===== REFERIDOS ===== */}
          <Route path="/r/:code" element={<Pages.ReferralRedirect />} />
          <Route path="/referidos" element={<Pages.Referrals />} />

          {/* ===== REDIRECTS desde URLs ANTIGUAS (PascalCase → español) ===== */}
          {/* El componente LegacyRedirect detecta la URL vieja y redirige con <Navigate replace>. */}
          <Route path="*" element={<LegacyRedirect />} />
        </Routes>
      </LayoutWrapper>
    </Suspense>
  );
};


function App() {

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <NavigationTracker />
              <AuthenticatedApp />
            </Router>
            <Toaster />
            <VisualEditAgent />
          </QueryClientProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App