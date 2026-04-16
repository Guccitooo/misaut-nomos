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
import { Suspense } from 'react';

// Spinner reutilizable para Suspense boundaries de páginas lazy
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/60">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

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
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
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
          <Route path="/autonomo/:slug" element={<Pages.Autonomo />} />
          <Route path="/categoria" element={<Pages.Categoria />} />
          <Route path="/categoria/:slug" element={<Pages.Categoria />} />
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
          <Route path="/aviso-legal" element={<Pages.LegalNotice />} />

          {/* ===== RUTAS DE CLIENTE ===== */}
          <Route path="/mensajes" element={<Pages.Messages />} />
          <Route path="/favoritos" element={<Pages.Favorites />} />
          <Route path="/mi-perfil" element={<Pages.MyProfile />} />
          <Route path="/soporte" element={<Pages.Tickets />} />
          <Route path="/soporte/:id" element={<Pages.TicketDetail />} />
          <Route path="/presupuestos" element={<Pages.Presupuestos />} />
          <Route path="/pedir-presupuesto" element={<Pages.RequestQuote />} />
          <Route path="/solicitudes" element={<Pages.QuoteRequests />} />
          <Route path="/notificaciones" element={<Pages.Notifications />} />

          {/* ===== RUTAS DE AUTÓNOMO ===== */}
          {/* Importante: /dashboard/info va ANTES que /dashboard para que matchee primero */}
          <Route path="/dashboard/info" element={<Pages.DashboardProInfo />} />
          <Route path="/dashboard" element={<Pages.ProfessionalDashboard />} />
          <Route path="/mis-clientes" element={<Pages.MisClientes />} />
          <Route path="/visibilidad" element={<Pages.MiVisibilidad />} />
          <Route path="/perfil" element={<Pages.ProfessionalProfile />} />
          <Route path="/perfil/:slug" element={<Pages.ProfessionalProfile />} />
          <Route path="/completar-perfil" element={<Pages.ProfileOnboarding />} />
          <Route path="/proyectos" element={<Pages.Projects />} />
          <Route path="/proyectos/:id" element={<Pages.ProjectDetail />} />
          <Route path="/calendario" element={<Pages.Calendar />} />
          <Route path="/facturas" element={<Pages.Invoices />} />
          <Route path="/pagar" element={<Pages.PayInvoice />} />
          <Route path="/pagar/:id" element={<Pages.PayInvoice />} />
          {/* /clientes/:id ANTES que /clientes para que matchee primero */}
          <Route path="/clientes/:id" element={<Pages.ClientDetail />} />
          <Route path="/clientes" element={<Pages.MisClientes />} />
          <Route path="/automatizaciones" element={<Pages.CRMAutomations />} />
          <Route path="/trabajos" element={<Pages.Jobs />} />
          <Route path="/suscripcion" element={<Pages.SubscriptionManagement />} />
          <Route path="/pago-exitoso" element={<Pages.PaymentSuccess />} />
          <Route path="/bienvenida" element={<Pages.Onboarding />} />

          {/* ===== RUTAS ADMIN ===== */}
          {/* Subrutas admin ANTES que /admin para matchear primero */}
          <Route path="/admin/pagos" element={<Pages.AdminPayments />} />
          <Route path="/admin/soporte" element={<Pages.AdminTickets />} />
          <Route path="/admin/faq" element={<Pages.AdminFAQ />} />
          <Route path="/admin/mensajes" element={<Pages.AdminMessagesStats />} />
          <Route path="/admin" element={<Pages.AdminDashboard />} />

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
  )
}

export default App