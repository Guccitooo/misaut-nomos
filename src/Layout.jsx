import React, { useState, useEffect, Suspense, lazy } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Search,
  MessageSquare,
  User,
  Heart,
  Menu,
  LogOut,
  Briefcase,
  LayoutDashboard,
  CreditCard,
  X,
  Search as SearchIcon,
  FileText,
  Users,
  Eye,
  Home,
  HelpCircle,
  Ticket,
  TrendingUp,
  Headphones,
  Shield,
  Gift,
  BookOpen,
  Mail
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Lazy load componentes no críticos
const Footer = lazy(() => import("@/components/ui/Footer"));
const CookieBanner = lazy(() => import("@/components/ui/CookieBanner"));
const ScrollToTop = lazy(() => import("@/components/ui/ScrollToTop"));
const NotificationCenter = lazy(() => import("@/components/notifications/NotificationCenter"));
const NotificationPermissionBanner = lazy(() => import("@/components/notifications/NotificationPermissionBanner"));
const WebsiteSchema = lazy(() => import("@/components/seo/WebsiteSchema"));
import PageTransitions from "@/components/ui/PageTransitions";
import { setUserId, setUserTags, onesignalLogout } from "@/services/onesignalService";

import LanguageSwitcher, { useLanguage, LanguageProvider } from "@/components/ui/LanguageSwitcher";


const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';
// Preload del logo para mejorar LCP
if (typeof window !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = LOGO_URL;
  link.fetchPriority = 'high';
  document.head.appendChild(link);
}

// Sidebar optimizado con memo
const SidebarContentComponent = React.memo(function SidebarContentComponent({ navigationItems, location, user, isProfessional, isAdmin, isClient, unreadCount, language, onChangeLanguage, onLogout }) {
  return (
    <Sidebar className="border-r border-gray-200 bg-white shadow-sm hidden lg:flex">
      <SidebarHeader className="border-b border-gray-100 p-6">
        <Link to={createPageUrl("Search")} className="flex items-center gap-3" aria-label="Ir a búsqueda de profesionales">
          <img
            src={LOGO_URL}
            alt="Logo MisAutónomos"
            className="w-12 h-12 rounded-lg"
            width="48"
            height="48"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            style={{ width: '48px', height: '48px' }}
          />
          <div>
            <h2 className="font-bold text-xl text-gray-900">MisAutónomos</h2>
            <p className="text-xs text-gray-500">Plataforma de autónomos</p>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild={!item.action}
                    className={`hover:bg-blue-50 hover:text-blue-900 transition-all duration-150 rounded-xl mb-1 relative ${
                      location.pathname === item.url ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' : ''
                    }`}
                  >
                    {item.action ? (
                      <button onClick={item.action} className="flex items-center gap-3 px-4 py-3 w-full text-left cursor-pointer">
                        <item.icon className="w-5 h-5" aria-hidden="true" />
                        <span className="font-medium">{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ) : (
                      <Link to={item.url} className="flex items-center gap-3 px-4 py-3" aria-label={item.title}>
                        <item.icon className="w-5 h-5" aria-hidden="true" />
                        <span className="font-medium">{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold" aria-label={`${item.badge} unread`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-100 p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="w-10 h-10 border-2 border-blue-600 overflow-hidden">
              {user?.profile_picture ? (
                <AvatarImage src={user.profile_picture} alt="Profile" className="object-cover object-center w-full h-full" />
              ) : (
                <AvatarFallback className={`font-semibold text-white ${isAdmin ? 'bg-gradient-to-br from-purple-600 to-purple-800' : 'bg-gradient-to-br from-blue-600 to-blue-800'}`}>
                  {user?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {user?.full_name || 'Usuario'}
              </p>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-medium mt-0.5">
                  <Shield className="w-2.5 h-2.5" />
                  Administrador
                </span>
              )}
              {isProfessional && <p className="text-xs text-gray-500">Profesional</p>}
              {isClient && <p className="text-xs text-gray-500">Cliente</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 px-2">
            <div className="flex-1">
              <LanguageSwitcher />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
              onClick={onLogout}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-600" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
});

const LayoutContent = React.memo(function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [professionalProfile, setProfessionalProfile] = useState(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // Redirect from old domain to new domain
  useEffect(() => {
    if (window.location.hostname === 'autonomosmil.es' || window.location.hostname === 'www.autonomosmil.es') {
      window.location.replace('https://misautonomos.es' + window.location.pathname + window.location.search);
    }
  }, []);


  useEffect(() => {
    if (window.gtag) return;

    let analyticsLoaded = false;

    const loadAnalytics = () => {
      if (analyticsLoaded) return;
      analyticsLoaded = true;

      // Cargar solo cuando el usuario lo consiente
      const consentGiven = sessionStorage.getItem('analytics_consent') === 'true';
      if (!consentGiven) return;

      const scriptGA = document.createElement('script');
      scriptGA.src = 'https://www.googletagmanager.com/gtag/js?id=G-P9DN7YN239';
      scriptGA.async = true;
      document.head.appendChild(scriptGA);

      const scriptAds = document.createElement('script');
      scriptAds.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17763802205';
      scriptAds.async = true;
      document.head.appendChild(scriptAds);

      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      window.gtag = gtag;

      gtag('consent', 'default', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted',
      });

      gtag('js', new Date());
      gtag('config', 'G-P9DN7YN239', { 'send_page_view': false });
      gtag('config', 'AW-17763802205');
    };

    // Cargar solo después de interacción significativa
    const onInteraction = () => {
      loadAnalytics();
      window.removeEventListener('click', onInteraction);
      window.removeEventListener('scroll', onInteraction, { passive: true });
    };

    window.addEventListener('click', onInteraction, { once: true });
    window.addEventListener('scroll', onInteraction, { passive: true, once: true });

    // Fallback después de 10 segundos (más tiempo)
    const timer = setTimeout(loadAnalytics, 10000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', onInteraction);
      window.removeEventListener('scroll', onInteraction);
    };
  }, []);

  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname,
        page_title: currentPageName || document.title,
      });
    }
  }, [location.pathname, currentPageName]);

  const hideBottomBarRoutes = [
    createPageUrl("UserTypeSelection"),    // /registro
    createPageUrl("ProfileOnboarding"),   // /completar-perfil
    createPageUrl("ClientOnboarding"),    // /registro-cliente
    createPageUrl("Onboarding"),          // /bienvenida
  ];

  const shouldShowSidebar = () => {
    if (!user || loadingUser) return false;
    if (hideBottomBarRoutes.includes(location.pathname)) return false;
    
    // 🔥 CLIENTES: SIEMPRE mostrar sidebar
    if (user.user_type === "client") return true;
    
    // PROFESIONALES: verificar onboarding
    if (user.user_type === "professionnel") {
      if (professionalProfile === undefined) return false;
      if (professionalProfile && (!professionalProfile.onboarding_completed)) {
        return false;
      }
    }
    
    return true;
  };

  // Redirigir a onboarding si es profesional sin completar
  useEffect(() => {
    if (loadingUser || !user) return;
    
    const isOnboardingRoute = location.pathname === createPageUrl("ProfileOnboarding") || 
                              location.pathname.startsWith(createPageUrl("ProfileOnboarding")) ||
                              location.pathname === createPageUrl("PricingPlans") ||
                              location.pathname === createPageUrl("SubscriptionManagement") ||
                              location.pathname === createPageUrl("PaymentSuccess");
    
    if (user.user_type === "professionnel" && professionalProfile !== undefined) {
      if (!professionalProfile || !professionalProfile.onboarding_completed) {
        if (!isOnboardingRoute) {
          navigate(createPageUrl("ProfileOnboarding"));
        }
      }
    }
  }, [user, professionalProfile, loadingUser, location.pathname]);

  const loadUser = React.useCallback(async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isPostPayment = urlParams.get('session_id') || 
                            urlParams.get('onboarding') || 
                            location.pathname.includes('PaymentSuccess') ||
                            location.pathname.includes('SubscriptionManagement');

      // CAMBIO: cache extendido a 5 minutos (antes 60s) — el perfil no cambia con frecuencia
      const cached = sessionStorage.getItem('current_user');
      if (cached && !isPostPayment) {
        const { user: cachedUser, profile: cachedProfile, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 300000) {
          setUser(cachedUser);
          setProfessionalProfile(cachedProfile);
          setLoadingUser(false);
          return;
        }
      }

      // Paralelizar auth + perfil en un solo round-trip
      const currentUser = await base44.auth.me();

      if (currentUser) {
        // Usuarios sin user_type (entraron con Google sin pasar por onboarding) → asignar "client"
        if (!currentUser.user_type) {
          await base44.auth.updateMe({ user_type: "client" });
          currentUser.user_type = "client";
        }

        const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: currentUser.id });
        const profile = profiles[0] || null;
        setProfessionalProfile(profile);

        if (!isPostPayment) {
          sessionStorage.setItem('current_user', JSON.stringify({
            user: currentUser,
            profile,
            timestamp: Date.now()
          }));
        }
      } else {
        setProfessionalProfile(null);
      }

      setUser(currentUser);

      // Re-asociar usuario con OneSignal si ya tenía notificaciones activadas
      if (currentUser) {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function(OneSignal) {
          const externalId = OneSignal.User.externalId;
          if (!externalId || externalId !== currentUser.id) {
            await OneSignal.login(currentUser.id);
          }
        });
      }
    } catch (error) {
      setUser(null);
      setProfessionalProfile(null);
      sessionStorage.removeItem('current_user');
    } finally {
      setLoadingUser(false);
    }
  }, [location.pathname]);

  const loadUnreadCount = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      // Cache extendido a 5 minutos
      const cached = sessionStorage.getItem('unread_count');
      if (cached) {
        const { count, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 300000) {
          setUnreadCount(count);
          return;
        }
      }

      const messages = await base44.entities.Message.filter({
        recipient_id: user.id,
        is_read: false
      });
      const count = messages.length;
      setUnreadCount(count);
      sessionStorage.setItem('unread_count', JSON.stringify({
        count,
        timestamp: Date.now()
      }));
    } catch (error) {
      setUnreadCount(0);
    }
  }, [user?.id]);

  // Cargar usuario solo una vez al montar
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
    }
  }, [user, loadUnreadCount]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isAdmin = user?.role === "admin";
  const isProfessional = React.useMemo(() => {
    if (!user) return false;
    return user.user_type === "professionnel" && !isAdmin;
  }, [user, isAdmin]);
  const isClient = React.useMemo(() => {
    if (!user) return false;
    return user.user_type === "client" && !isAdmin;
  }, [user, isAdmin]);

  const handleLogout = () => {
    sessionStorage.removeItem('current_user');
    sessionStorage.removeItem('unread_count');
    setUser(null);
    setUnreadCount(0);
    setProfessionalProfile(null);
    onesignalLogout();
    base44.auth.logout(createPageUrl("Search"));
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const getDisplayName = () => {
    if (!user) return "";
    
    if (user.user_type === "professionnel" && professionalProfile?.business_name && !isAdmin) {
      return professionalProfile.business_name;
    }
    
    if (user.full_name && user.full_name.trim() !== "") {
      return user.full_name;
    }
    
    if (user.email) {
      const username = user.email.split('@')[0];
      const cleaned = username.replace(/\d+$/g, '');
      
      if (cleaned.includes('-') || cleaned.includes('.') || cleaned.includes('_')) {
        return cleaned
          .split(/[-._]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    }
    
    return "Usuario";
  };

  const getProfilePicture = () => {
    return user?.profile_picture || null;
  };

  const getNavigationItems = () => {
    const items = [];

    if (isAdmin) {
      items.push(
        { title: "Administración", url: createPageUrl("AdminDashboard"), icon: LayoutDashboard },
        { title: "💰 Pagos", url: createPageUrl("AdminPayments"), icon: CreditCard },
        { title: "Bandeja de Soporte", url: "/admin/soporte", icon: Headphones },
        { title: "SEO Analytics", url: "/admin/seo", icon: TrendingUp },
        { title: "Blog", url: "/admin/blog", icon: BookOpen },
        { title: "Newsletter", url: "/admin/newsletter", icon: Mail }
      );
    } else if (isProfessional) {
      items.push(
        { title: t('nav.home'), url: createPageUrl("ProfessionalDashboard"), icon: Home },
        { title: t('nav.messages'), url: createPageUrl("Messages"), icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : null },
        { title: t('nav.my_clients'), url: "/mis-clientes", icon: Users },
        { title: t('nav.quotes'), url: "/presupuestos", icon: FileText },
        { title: t('nav.invoices'), url: createPageUrl("Invoices"), icon: FileText },
        { title: t('nav.visibility'), url: "/visibilidad", icon: Eye },
        { title: t('nav.my_profile'), url: createPageUrl("MyProfile"), icon: User },
        { title: t('nav.my_subscription'), url: createPageUrl("SubscriptionManagement"), icon: CreditCard },
        { title: 'Invita y gana', url: "/referidos", icon: Gift },
        { title: t('nav.support'), url: "/soporte", icon: Headphones }
      );
    } else if (isClient) {
      items.push(
        { title: t('nav.search_professionals'), url: createPageUrl("Search"), icon: Search },
        { title: t('nav.messages'), url: createPageUrl("Messages"), icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : null },
        { title: t('nav.favorites'), url: createPageUrl("Favorites"), icon: Heart },
        { title: t('nav.my_profile'), url: createPageUrl("MyProfile"), icon: User },
        { title: t('nav.view_plans'), url: createPageUrl("PricingPlans"), icon: CreditCard },
        { title: t('nav.faq'), url: createPageUrl("FAQ"), icon: MessageSquare },
        { title: t('nav.support'), url: "/soporte", icon: Headphones }
      );
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  // CAMBIO: bloque <style> eliminado — todas estas reglas ya existen en globals.css.
  // Eliminar el inline style evita: CSS duplicado, conflictos de especificidad y ~20KB extra en el bundle.
  return (
    <SidebarProvider style={{ '--sidebar-width': '16rem', '--sidebar-width-mobile': '0px' }}>
        <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-slate-50 to-blue-50" style={{ marginLeft: 0, width: '100%', maxWidth: '100vw', overflow: 'visible' }}>
          <div className="flex flex-1" style={{ minWidth: 0, overflow: 'visible' }}>
            {user && shouldShowSidebar() && (
              <SidebarContentComponent 
                navigationItems={navigationItems}
                location={location}
                user={user}
                isProfessional={isProfessional}
                isAdmin={isAdmin}
                isClient={isClient}
                unreadCount={unreadCount}
                language={language}
                onChangeLanguage={changeLanguage}
                onLogout={handleLogout}
              />
            )}

            {/* ── MENÚ HAMBURGUESA MÓVIL ── */}
            {mobileMenuOpen && (
              <>
                <div
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', zIndex: 9998 }}
                  aria-hidden="true"
                />
                <nav
                  style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '280px', background: '#fff', zIndex: 9999, overflowY: 'auto', boxShadow: '4px 0 24px rgba(0,0,0,0.18)' }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Menú de navegación"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <img src={LOGO_URL} alt="" className="w-8 h-8 rounded" width="32" height="32" />
                      <span className="font-bold text-gray-900">MisAutónomos</span>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ width: '44px', height: '44px', touchAction: 'manipulation' }}
                      className="flex items-center justify-center rounded-lg hover:bg-gray-100"
                      aria-label="Cerrar menú"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="py-2">
                    {/* Usuario logueado: avatar + nombre */}
                    {user && (
                      <div className="flex items-center gap-3 mx-3 mb-2 p-3 bg-blue-50 rounded-xl">
                        <Avatar className="w-10 h-10 border-2 border-blue-600 overflow-hidden flex-shrink-0">
                          {getProfilePicture() ? (
                            <AvatarImage src={getProfilePicture()} alt={getDisplayName()} className="object-cover w-full h-full" />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white font-semibold">
                              {getDisplayName().charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{getDisplayName()}</p>
                          <p className="text-xs text-gray-500">{isProfessional ? 'Profesional' : 'Cliente'}</p>
                        </div>
                      </div>
                    )}

                    {/* Nav items (logueado) */}
                    {user && navigationItems.map((item) => (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 mx-2 rounded-xl ${
                          location.pathname === item.url
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                        }`}
                        style={{ padding: '14px 16px', fontSize: '15px', touchAction: 'manipulation' }}
                      >
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${location.pathname === item.url ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="font-medium flex-1">{item.title}</span>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold min-w-[20px] text-center">{item.badge}</span>
                        )}
                      </Link>
                    ))}

                    {/* Sin sesión: opciones */}
                    {!user && (
                      <div className="px-3 space-y-1">
                        <Link
                          to="/buscar"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl text-gray-700 hover:bg-gray-50"
                          style={{ padding: '14px 16px', fontSize: '15px', touchAction: 'manipulation' }}
                        >
                          <SearchIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <span className="font-medium">{t('nav.search_professionals')}</span>
                        </Link>
                        <Link
                          to="/blog"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl text-gray-700 hover:bg-gray-50"
                          style={{ padding: '14px 16px', fontSize: '15px', touchAction: 'manipulation' }}
                        >
                          <BookOpen className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          <span className="font-medium">Blog</span>
                        </Link>
                        <Link
                          to="/precios"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl text-gray-700 hover:bg-gray-50"
                          style={{ padding: '14px 16px', fontSize: '15px', touchAction: 'manipulation' }}
                        >
                          <HelpCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                          <span className="font-medium">{t('nav.view_plans')}</span>
                        </Link>

                        <div className="pt-2 border-t border-gray-100 space-y-2 mt-2">
                          <Link
                            to="/registro-cliente"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold text-white"
                            style={{ padding: '14px', fontSize: '15px', touchAction: 'manipulation', background: '#16a34a' }}
                          >
                            <User className="w-5 h-5" />
                            {t('nav.sign_up_client')}
                          </Link>
                          <Link
                            to="/precios"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold text-white"
                            style={{ padding: '14px', fontSize: '15px', touchAction: 'manipulation', background: '#2563eb' }}
                          >
                            <Briefcase className="w-5 h-5" />
                            {t('nav.sign_up_pro')}
                          </Link>
                          <button
                            onClick={() => { handleLogin(); setMobileMenuOpen(false); }}
                            className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold text-gray-700 border-2 border-gray-200 hover:bg-gray-50"
                            style={{ padding: '14px', fontSize: '15px', touchAction: 'manipulation' }}
                          >
                            <User className="w-5 h-5" />
                            {t('nav.login')}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Cerrar sesión */}
                    {user && (
                      <>
                        <div className="mx-3 mt-2 border-t border-gray-100 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full rounded-xl text-red-600 hover:bg-red-50 active:bg-red-100"
                            style={{ padding: '14px 16px', fontSize: '15px', touchAction: 'manipulation' }}
                          >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{t('nav.logout')}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </nav>
              </>
            )}

            {/* ── MODAL "UNIRSE" (bottom sheet) ── */}
            {joinModalOpen && (
              <>
                <div
                  onClick={() => setJoinModalOpen(false)}
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
                  aria-hidden="true"
                />
                <div
                  style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: '#fff', zIndex: 9999, borderRadius: '20px 20px 0 0',
                    padding: '24px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
                    boxShadow: '0 -8px 32px rgba(0,0,0,0.18)'
                  }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Opciones de registro"
                >
                  <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
                  <h2 className="text-xl font-bold text-gray-900 text-center mb-2">¿Cómo quieres unirte?</h2>
                  <p className="text-sm text-gray-500 text-center mb-6">Elige tu perfil para empezar</p>
                  <div className="space-y-3">
                    <Link
                      to="/registro-cliente"
                      onClick={() => setJoinModalOpen(false)}
                      className="flex items-center gap-4 w-full rounded-2xl p-4 text-white font-semibold"
                      style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', touchAction: 'manipulation' }}
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <SearchIcon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold">Soy cliente</div>
                        <div className="text-xs text-green-100">Busco profesionales</div>
                      </div>
                    </Link>
                    <Link
                      to="/precios"
                      onClick={() => setJoinModalOpen(false)}
                      className="flex items-center gap-4 w-full rounded-2xl p-4 text-white font-semibold"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', touchAction: 'manipulation' }}
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold">Soy autónomo</div>
                        <div className="text-xs text-blue-100">Quiero conseguir clientes</div>
                      </div>
                    </Link>
                    <button
                      onClick={() => { handleLogin(); setJoinModalOpen(false); }}
                      className="w-full text-center text-sm text-gray-500 py-3 font-medium"
                      style={{ touchAction: 'manipulation' }}
                    >
                      Ya tengo cuenta → <span className="text-blue-600 font-semibold">Iniciar sesión</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── HEADER MÓVIL — SIEMPRE VISIBLE, fuera del main para evitar margin-left del sidebar ── */}
            <header
              className="lg:hidden bg-white border-b border-gray-100 flex items-center justify-between px-4"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '56px',
                zIndex: 45,
                paddingTop: 'env(safe-area-inset-top, 0px)',
              }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(true); }}
                style={{ width: '48px', height: '48px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', cursor: 'pointer', zIndex: 46, position: 'relative' }}
                className="flex items-center justify-center rounded-lg flex-shrink-0 active:bg-gray-100"
                aria-label="Abrir menú"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>

              <Link to={createPageUrl("Search")} className="flex items-center gap-2" aria-label="Inicio">
                <img src={LOGO_URL} alt="Logo MisAutónomos" className="w-8 h-8 rounded" width="32" height="32" loading="eager" fetchpriority="high" decoding="async" />
                <span className="font-bold text-lg text-gray-900">MisAutónomos</span>
              </Link>

              <div style={{ width: '44px', height: '44px' }} className="flex items-center justify-end flex-shrink-0">
                {user ? (
                  <Suspense fallback={<div className="w-9 h-9" />}>
                    <NotificationCenter user={user} />
                  </Suspense>
                ) : (
                  <button
                    onClick={() => setJoinModalOpen(true)}
                    style={{ width: '44px', height: '44px', touchAction: 'manipulation' }}
                    className="flex items-center justify-center rounded-lg hover:bg-gray-100 text-blue-600"
                    aria-label="Unirse"
                  >
                    <User className="w-5 h-5" />
                  </button>
                )}
              </div>
            </header>

            <main className="flex-1 flex flex-col min-h-0 min-w-0" style={{ width: '100%', maxWidth: '100vw', overflow: 'visible' }}>
              {!user && (
                  <header className="bg-white border-b border-gray-200 px-6 py-4 hidden lg:block sticky top-0 z-20 shadow-sm will-change-transform">
                  <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to={createPageUrl("Search")} className="flex items-center gap-3" aria-label="Ir a búsqueda">
                      <img
                        src={LOGO_URL}
                        alt="Logo MisAutónomos"
                        className="w-12 h-12 rounded-lg"
                        width="48"
                        height="48"
                        loading="eager"
                        fetchpriority="high"
                        decoding="async"
                      />
                      <div style={{ minWidth: '150px' }}>
                        <h1 className="font-bold text-xl text-gray-900">MisAutónomos</h1>
                        <p className="text-xs text-gray-500">{t('footer.tagline')}</p>
                      </div>
                      </Link>
                    
                    <div className="flex items-center gap-3">
                      {!user && (
                        <Button
                          variant="ghost"
                          className="text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                          onClick={handleLogin}
                          aria-label={t('nav.login')}
                        >
                          <User className="w-4 h-4 mr-2" aria-hidden="true" />
                          {t('nav.login')}
                        </Button>
                      )}
                      {!user && (
                        <Link to={createPageUrl("ClientOnboarding")}>
                          <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                            <User className="w-4 h-4 mr-2" aria-hidden="true" />
                            {t('nav.sign_up_client')}
                          </Button>
                        </Link>
                      )}
                      {(!user || user.user_type !== 'professionnel') ? (
                        <Link to={createPageUrl("PricingPlans")}>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                            <Briefcase className="w-4 h-4 mr-2" aria-hidden="true" />
                            {t('nav.sign_up_pro')}
                          </Button>
                        </Link>
                      ) : null}
                      <LanguageSwitcher />
                      {user && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-50 hover:text-red-600 transition-colors"
                          onClick={handleLogout}
                          aria-label={t('nav.logout')}
                        >
                          <LogOut className="w-5 h-5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </div>
                </header>
              )}

              <div className="flex-1 pb-16 md:pb-0 transition-opacity duration-150 ease-in-out mobile-main-content">
                <Suspense fallback={null}>
                  <PageTransitions>
                    {children}
                  </PageTransitions>
                </Suspense>

                {!location.pathname.startsWith("/soporte") && (
                  <Suspense fallback={null}>
                    <Footer />
                  </Suspense>
                )}
              </div>

              {/* Bottom nav móvil — solo visible en móvil (< 768px) */}
              <nav
                className="mobile-bottom-nav"
                data-role="bottom-nav"
                role="navigation"
                aria-label="Navegación principal"
                style={{
                  gridTemplateColumns: (user && isProfessional) ? 'repeat(5, 1fr)' : user ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
                  paddingBottom: 'env(safe-area-inset-bottom, 8px)',
                  height: 'calc(56px + env(safe-area-inset-bottom, 8px))',
                }}
              >
                {user ? (
                  <>
                    {(isProfessional ? [
                      { title: 'Inicio', url: createPageUrl("ProfessionalDashboard"), icon: Home },
                      { title: 'Chats', url: createPageUrl("Messages"), icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : null },
                      { title: 'Clientes', url: "/mis-clientes", icon: Users },
                      { title: 'Presupuestos', url: "/presupuestos", icon: FileText },
                      { title: 'Perfil', url: createPageUrl("MyProfile"), icon: User },
                    ] : [
                      { title: 'Buscar', url: createPageUrl("Search"), icon: SearchIcon },
                      { title: 'Chats', url: createPageUrl("Messages"), icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : null },
                      { title: 'Guardados', url: createPageUrl("Favorites"), icon: Heart },
                      { title: 'Perfil', url: createPageUrl("MyProfile"), icon: User },
                    ]).map((item) => (
                      <Link
                        key={item.title}
                        to={item.url}
                        className={`mobile-bottom-nav-item ${location.pathname === item.url ? 'active' : ''}`}
                        aria-label={item.title}
                        aria-current={location.pathname === item.url ? 'page' : undefined}
                        style={{ touchAction: 'manipulation', flex: 1, minWidth: 0 }}
                      >
                        <div className="relative">
                          <item.icon className="w-5 h-5" />
                          {item.badge && (
                            <span className="absolute -top-1 -right-2 bg-red-500 text-white font-bold rounded-full flex items-center justify-center px-1" style={{ fontSize: '10px', minWidth: '16px', height: '16px' }}>
                              {item.badge > 9 ? '9+' : item.badge}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 500, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{item.title}</span>
                      </Link>
                    ))}
                  </>
                ) : (
                  <>
                    <Link
                      to={createPageUrl("Search")}
                      className={`mobile-bottom-nav-item ${location.pathname === createPageUrl("Search") ? 'active' : ''}`}
                      aria-label="Buscar"
                      style={{ touchAction: 'manipulation', flex: 1, minWidth: 0 }}
                    >
                      <SearchIcon className="w-5 h-5" />
                      <span style={{ fontSize: '10px', fontWeight: 500 }}>Buscar</span>
                    </Link>
                    <button
                      onClick={() => setJoinModalOpen(true)}
                      className="mobile-bottom-nav-item"
                      aria-label="Unirse"
                      style={{ touchAction: 'manipulation', border: 'none', background: 'none', cursor: 'pointer', flex: 1, minWidth: 0 }}
                    >
                      <Briefcase className="w-5 h-5" />
                      <span style={{ fontSize: '10px', fontWeight: 500 }}>Unirse</span>
                    </button>
                  </>
                )}
              </nav>
            </main>
          </div>

          {user && 'Notification' in window && (
            <Suspense fallback={null}>
              <NotificationPermissionBanner user={user} />
            </Suspense>
          )}
          <Suspense fallback={null}>
            <CookieBanner />
          </Suspense>
          <Suspense fallback={null}>
            <WebsiteSchema />
          </Suspense>
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
        </div>
    </SidebarProvider>
  );
});

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}