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
  Home
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
const WebsiteSchema = lazy(() => import("@/components/seo/WebsiteSchema"));
import PageTransitions from "@/components/ui/PageTransitions";

import { useLanguage, LanguageProvider } from "@/components/ui/LanguageSwitcher";

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';

const LayoutContent = React.memo(function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [professionalProfile, setProfessionalProfile] = useState(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

      const currentUser = await base44.auth.me();

      if (currentUser) {
        const profiles = await base44.entities.ProfessionalProfile.filter({
          user_id: currentUser.id
        });
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

  const isProfessional = React.useMemo(() => {
    if (!user) return false;
    // Es profesional si user_type es professionnel (después del pago)
    if (user.user_type === "professionnel") return true;
    // O si tiene perfil profesional
    if (professionalProfile && professionalProfile.user_id === user.id) return true;
    return false;
  }, [user, professionalProfile]);

  const handleLogout = () => {
    // Limpiar cache de sesión
    sessionStorage.removeItem('current_user');
    sessionStorage.removeItem('unread_count');
    // Limpiar estado local
    setUser(null);
    setUnreadCount(0);
    setProfessionalProfile(null);
    // Cerrar sesión (redirige automáticamente)
    base44.auth.logout(createPageUrl("Search"));
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const getDisplayName = () => {
    if (!user) return "";
    
    if (user.user_type === "professionnel" && professionalProfile?.business_name) {
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

  // Menú específico según rol
  const navigationItems = [];

  if (isProfessional) {
    // MENÚ PARA AUTÓNOMOS — solo lo útil
    navigationItems.push(
      {
        title: "Inicio",
        url: createPageUrl("ProfessionalDashboard"),
        icon: Home,
      },
      {
        title: t('messages'),
        url: createPageUrl("Messages"),
        icon: MessageSquare,
        badge: unreadCount > 0 ? unreadCount : null
      },
      {
        title: "Mis clientes",
        url: "/mis-clientes",
        icon: Users,
      },
      {
        title: "Facturas",
        url: createPageUrl("Invoices"),
        icon: FileText,
      },
      {
        title: "Mi visibilidad",
        url: "/visibilidad",
        icon: Eye,
      },
      {
        title: "Mi perfil",
        url: createPageUrl("MyProfile"),
        icon: User,
      },
      {
        title: "Mi suscripción",
        url: createPageUrl("SubscriptionManagement"),
        icon: CreditCard,
      },
    );
  } else {
    // MENÚ PARA CLIENTES
    navigationItems.push(
      {
        title: t('searchFreelancers'),
        url: createPageUrl("Search"),
        icon: Search,
      },
      {
        title: t('messages'),
        url: createPageUrl("Messages"),
        icon: MessageSquare,
        badge: unreadCount > 0 ? unreadCount : null
      },
      {
        title: "Presupuestos",
        url: createPageUrl("Presupuestos"),
        icon: FileText,
      },
      {
        title: t('favorites'),
        url: createPageUrl("Favorites"),
        icon: Heart,
      },
      {
        title: t('myProfile'),
        url: createPageUrl("MyProfile"),
        icon: User,
      },
      {
        title: t('viewPlans'),
        url: createPageUrl("PricingPlans"),
        icon: CreditCard,
      },
      {
        title: t('faq'),
        url: createPageUrl("FAQ"),
        icon: MessageSquare,
      },
      {
        title: t('supportTickets'),
        url: createPageUrl("Tickets"),
        icon: MessageSquare,
      }
    );
  }

  console.log('DEBUG USER ROLE:', JSON.stringify({ role: user?.role, email: user?.email, id: user?.id }));

  if (user?.role === "admin") {
    navigationItems.push(
      {
        title: t('administration'),
        url: createPageUrl("AdminDashboard"),
        icon: LayoutDashboard,
      },
      {
        title: "💰 Pagos",
        url: createPageUrl("AdminPayments"),
        icon: CreditCard,
      },
      {
        title: "Admin Tickets",
        url: createPageUrl("AdminTickets"),
        icon: MessageSquare,
      }
    );
  }

  // CAMBIO: bloque <style> eliminado — todas estas reglas ya existen en globals.css.
  // Eliminar el inline style evita: CSS duplicado, conflictos de especificidad y ~20KB extra en el bundle.
  return (
    <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="flex flex-1">
            {user && shouldShowSidebar() && (
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
                    fetchpriority="high"
                    decoding="async"
                  />
                    <div>
                      <h2 className="font-bold text-xl text-gray-900">MisAutónomos</h2>
                      <p className="text-xs text-gray-500">{t('tagline')}</p>
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
                              asChild 
                              className={`hover:bg-blue-50 hover:text-blue-900 transition-all duration-150 rounded-xl mb-1 relative ${
                                location.pathname === item.url ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' : ''
                              }`}
                            >
                              <Link to={item.url} className="flex items-center gap-3 px-4 py-3" aria-label={item.title}>
                                <item.icon className="w-5 h-5" aria-hidden="true" />
                                <span className="font-medium">{item.title}</span>
                                {item.badge && (
                                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold" aria-label={`${item.badge} ${t('unread')}`}>
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
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
                        {getProfilePicture() ? (
                          <AvatarImage src={getProfilePicture()} alt={`Foto de perfil de ${getDisplayName()}`} className="object-cover object-center w-full h-full" />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white font-semibold">
                            {getDisplayName().charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {getDisplayName()}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {isProfessional ? t('professional') : t('client')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-2">
                      <div className="flex gap-1 bg-gray-100 rounded-md p-1 flex-1">
                        <button
                          onClick={() => changeLanguage('es')}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                            language === 'es'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-200'
                          }`}
                          aria-label="Español"
                        >
                          ES
                        </button>
                        <button
                          onClick={() => changeLanguage('en')}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                            language === 'en'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-200'
                          }`}
                          aria-label="English"
                        >
                          EN
                        </button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                        onClick={handleLogout}
                        aria-label={t('logout')}
                      >
                        <LogOut className="w-4 h-4 text-gray-600" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </SidebarFooter>
              </Sidebar>
            )}

            {mobileMenuOpen && (
              <>
                {/* Overlay */}
                <div
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }}
                  aria-hidden="true"
                />
                {/* Menú lateral */}
                <nav
                  style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '80%', maxWidth: '320px', background: '#fff', zIndex: 50, overflowY: 'auto', boxShadow: '10px 0 40px rgba(0,0,0,0.2)' }}
                  role="dialog"
                  aria-label="Menú de navegación"
                >
                  {/* Header menú */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <img src={LOGO_URL} alt="" className="w-8 h-8 rounded" width="32" height="32" />
                      <span className="font-bold text-gray-900">MisAutónomos</span>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ width: '44px', height: '44px', touchAction: 'manipulation' }}
                      className="flex items-center justify-center rounded-lg"
                      aria-label="Cerrar menú"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="p-4 space-y-1">
                    {/* Usuario logueado: perfil + nav */}
                    {user && (
                      <div className="flex items-center gap-3 p-3 mb-3 bg-blue-50 rounded-xl">
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
                          <p className="text-xs text-gray-500">{isProfessional ? t('professional') : t('client')}</p>
                        </div>
                      </div>
                    )}

                    {user && navigationItems.map((item) => (
                      <Link
                        key={item.title}
                        to={item.url}
                        className={`flex items-center gap-3 rounded-xl mb-1 ${location.pathname === item.url ? 'bg-blue-600 text-white' : 'text-gray-700 active:bg-gray-100'}`}
                        style={{ padding: '12px 16px', fontSize: '16px', touchAction: 'manipulation' }}
                        aria-label={item.title}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium flex-1">{item.title}</span>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">{item.badge}</span>
                        )}
                      </Link>
                    ))}

                    {/* No logueado: opciones de registro */}
                    {!user && (
                      <>
                        <Link
                          to={createPageUrl("Search")}
                          className="flex items-center gap-3 rounded-xl text-gray-700 active:bg-gray-100"
                          style={{ padding: '14px 16px', fontSize: '16px', touchAction: 'manipulation' }}
                        >
                          <SearchIcon className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold">Buscar autónomo</span>
                        </Link>
                        <Link
                          to={createPageUrl("ClientOnboarding")}
                          className="flex items-center gap-3 rounded-xl text-gray-700 active:bg-gray-100"
                          style={{ padding: '14px 16px', fontSize: '16px', touchAction: 'manipulation' }}
                        >
                          <User className="w-5 h-5 text-green-600" />
                          <span className="font-semibold">Soy cliente</span>
                        </Link>
                        <Link
                          to={createPageUrl("PricingPlans")}
                          className="flex items-center gap-3 rounded-xl text-gray-700 active:bg-gray-100"
                          style={{ padding: '14px 16px', fontSize: '16px', touchAction: 'manipulation' }}
                        >
                          <Briefcase className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold">Hazte autónomo · 7 días gratis</span>
                        </Link>
                        <div className="pt-3 space-y-2">
                          <button
                            onClick={() => { handleLogin(); setMobileMenuOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 active:bg-gray-50"
                            style={{ padding: '14px', fontSize: '16px', touchAction: 'manipulation' }}
                          >
                            <User className="w-5 h-5" />
                            Iniciar sesión
                          </button>
                        </div>
                      </>
                    )}

                    {/* Cerrar sesión */}
                    {user && (
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 rounded-xl text-red-600 active:bg-red-50 mt-4"
                        style={{ padding: '14px 16px', fontSize: '16px', touchAction: 'manipulation' }}
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Cerrar sesión</span>
                      </button>
                    )}
                  </div>
                </nav>
              </>
            )}

            <main className="flex-1 flex flex-col overflow-hidden">
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
                        <p className="text-xs text-gray-500">{t('tagline')}</p>
                      </div>
                      </Link>
                    
                    <div className="flex items-center gap-3">
                      {!user && (
                        <Button
                          variant="ghost"
                          className="text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                          onClick={handleLogin}
                          aria-label={t('login')}
                        >
                          <User className="w-4 h-4 mr-2" aria-hidden="true" />
                          {t('login')}
                        </Button>
                      )}
                      {!user && (
                        <Link to={createPageUrl("ClientOnboarding")}>
                          <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                            <User className="w-4 h-4 mr-2" aria-hidden="true" />
                            Soy cliente
                          </Button>
                        </Link>
                      )}
                          {!user || user.user_type !== 'professionnel' ? (
                          <Link to={createPageUrl("PricingPlans")}>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                            <Briefcase className="w-4 h-4 mr-2" aria-hidden="true" />
                            {t('becomeFreelancer')} · 7 días gratis
                          </Button>
                          </Link>
                      ) : null}
                      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => changeLanguage('es')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            language === 'es'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-200'
                          }`}
                          aria-label="Español"
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
                          aria-label="English"
                        >
                          EN
                        </button>
                      </div>
                      {user && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-50 hover:text-red-600 transition-colors"
                          onClick={handleLogout}
                          aria-label={t('logout')}
                        >
                          <LogOut className="w-5 h-5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </div>
                </header>
              )}

              <header className="bg-white border-b border-gray-200 lg:hidden sticky top-0 z-20" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
                <div className="flex items-center justify-between">
                  {/* Izquierda: siempre hamburguesa */}
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex items-center justify-center rounded-lg"
                    style={{ width: '44px', height: '44px', touchAction: 'manipulation' }}
                    aria-label="Abrir menú"
                  >
                    <Menu className="w-6 h-6 text-gray-700" />
                  </button>

                  {/* Centro: logo */}
                  <Link to={createPageUrl("Search")} className="flex items-center gap-2" aria-label="Inicio">
                    <img src={LOGO_URL} alt="Logo MisAutónomos" className="w-8 h-8 rounded" width="32" height="32" loading="eager" fetchpriority="high" decoding="async" />
                    <span className="font-bold text-lg text-gray-900">MisAutónomos</span>
                  </Link>

                  {/* Derecha: notificaciones o vacío */}
                  <div style={{ width: '44px', height: '44px' }} className="flex items-center justify-end">
                    {user ? (
                      <Suspense fallback={<div className="w-9 h-9" />}>
                        <NotificationCenter user={user} />
                      </Suspense>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-auto pb-16 md:pb-0">
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                }>
                  <PageTransitions>
                    {children}
                  </PageTransitions>
                </Suspense>

                <Suspense fallback={null}>
                  <Footer />
                </Suspense>
              </div>

              {/* Bottom nav móvil — solo visible en móvil (< 768px) */}
              <nav
                className="mobile-bottom-nav"
                role="navigation"
                aria-label="Navegación principal"
                style={{
                  gridTemplateColumns: (user && isProfessional) ? 'repeat(5, 1fr)' : user ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
                }}
              >
                {user ? (
                  <>
                    {(isProfessional ? [
                      { title: 'Inicio', url: createPageUrl("ProfessionalDashboard"), icon: Home },
                      { title: 'Mensajes', url: createPageUrl("Messages"), icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : null },
                      { title: 'Clientes', url: "/mis-clientes", icon: Users },
                      { title: 'Facturas', url: createPageUrl("Invoices"), icon: FileText },
                      { title: 'Perfil', url: createPageUrl("MyProfile"), icon: User },
                    ] : [
                      { title: 'Buscar', url: createPageUrl("Search"), icon: SearchIcon },
                      { title: 'Mensajes', url: createPageUrl("Messages"), icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : null },
                      { title: 'Favoritos', url: createPageUrl("Favorites"), icon: Heart },
                      { title: 'Perfil', url: createPageUrl("MyProfile"), icon: User },
                    ]).map((item) => (
                      <Link
                        key={item.title}
                        to={item.url}
                        className={`mobile-bottom-nav-item ${location.pathname === item.url ? 'active' : ''}`}
                        aria-label={item.title}
                        aria-current={location.pathname === item.url ? 'page' : undefined}
                        style={{ touchAction: 'manipulation' }}
                      >
                        <item.icon className="w-6 h-6" />
                        <span>{item.title}</span>
                        {item.badge && <span className="mobile-bottom-nav-badge">{item.badge}</span>}
                      </Link>
                    ))}
                  </>
                ) : (
                  <>
                    <Link
                      to={createPageUrl("Search")}
                      className={`mobile-bottom-nav-item ${location.pathname === createPageUrl("Search") ? 'active' : ''}`}
                      aria-label="Buscar"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <SearchIcon className="w-6 h-6" />
                      <span>Buscar</span>
                    </Link>
                    <Link
                      to={createPageUrl("UserTypeSelection")}
                      className="mobile-bottom-nav-item"
                      aria-label="Unirse"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <Briefcase className="w-6 h-6" />
                      <span>Unirse</span>
                    </Link>
                  </>
                )}
              </nav>
            </main>
          </div>

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