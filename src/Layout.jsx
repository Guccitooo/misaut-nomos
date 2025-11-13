
import React, { useState, useEffect } from "react";
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
  AlertCircle,
  X
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Footer from "@/components/ui/Footer";
import CookieBanner from "@/components/ui/CookieBanner";
import LanguageSwitcher, { useLanguage, LanguageProvider } from "@/components/ui/LanguageSwitcher";
import ScrollToTop from "@/components/ui/ScrollToTop";
import NotificationCenter from "@/components/notifications/NotificationCenter";

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [professionalProfile, setProfessionalProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ NUEVO: Google Analytics 4 - Cargar script solo una vez
  useEffect(() => {
    // Verificar si ya está cargado para evitar duplicados
    if (window.gtag) {
      console.log('✅ Google Analytics ya está cargado');
      return;
    }

    console.log('📊 Inicializando Google Analytics 4...');

    // Crear script de gtag.js
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-P9DN7YN239';
    script.async = true;
    document.head.appendChild(script);

    // Inicializar Google Analytics
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    
    gtag('js', new Date());
    gtag('config', 'G-P9DN7YN239', {
      'send_page_view': true
    });

    console.log('✅ Google Analytics 4 inicializado correctamente');

    return () => {
      // Cleanup if needed (though we usually want it to persist)
      // console.log('🔄 Layout desmontado, GA4 script might persist.');
    };
  }, []); // Solo ejecutar una vez al montar

  // ✅ NUEVO: Rastrear cambios de página en Google Analytics
  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname,
        page_title: currentPageName || document.title,
      });
      console.log('📊 GA4 Page View:', location.pathname, 'Title:', currentPageName || document.title);
    }
  }, [location.pathname, currentPageName]);


  // ✅ NUEVO: Rutas donde NO se debe mostrar la barra inferior
  const hideBottomBarRoutes = [
    createPageUrl("UserTypeSelection"),
    createPageUrl("ProfileOnboarding"),
    createPageUrl("ClientOnboarding"),
    createPageUrl("PricingPlans"),
    createPageUrl("Onboarding")
  ];

  // ✅ NUEVO: Determinar si se debe mostrar la barra inferior
  const shouldShowBottomBar = () => {
    // 1. No mostrar si no hay usuario
    if (!user) return false;
    
    // 2. No mostrar en rutas específicas
    if (hideBottomBarRoutes.includes(location.pathname)) return false;
    
    // 3. No mostrar si el usuario no tiene tipo definido (debería tenerlo si user existe)
    if (!user.user_type) return false;
    
    // 4. Si es profesional, verificar que haya completado onboarding
    if (user.user_type === "professionnel") {
      // Si no hay perfil cargado aún, no mostrar
      if (professionalProfile === null) return false; // Use null to distinguish between not loaded and no profile found
      
      // Si el perfil no está completo o no es visible, no mostrar
      if (!professionalProfile.onboarding_completed || !professionalProfile.visible_en_busqueda) {
        return false;
      }
    }
    
    // 5. En todos los demás casos, mostrar la barra
    return true;
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    loadUnreadCount();
  }, [user]);

  useEffect(() => {
    checkOnboardingStatus();
    checkSubscriptionStatus();
  }, [user, location.pathname]);

  // ✅ Cerrar menú móvil al cambiar de página
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (currentUser && currentUser.user_type === "professionnel") {
        const profiles = await base44.entities.ProfessionalProfile.filter({
          user_id: currentUser.id
        });
        if (profiles[0]) {
          setProfessionalProfile(profiles[0]);
        } else {
          setProfessionalProfile(undefined); // Indicate no professional profile found
        }
      } else {
        setProfessionalProfile(undefined); // Not a professional user
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
      setProfessionalProfile(undefined); // Reset profile on error
    }
  };

  const loadUnreadCount = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser) {
        const messages = await base44.entities.Message.filter({
          recipient_id: currentUser.id,
          is_read: false
        });
        setUnreadCount(messages.length);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
      setUnreadCount(0);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (!user || user.user_type !== "professionnel") {
      setHasActiveSubscription(false);
      return;
    }

    try {
      const subscriptions = await base44.entities.Subscription.filter({
        user_id: user.id
      });

      const activeStates = ["activo", "en_prueba", "trialing"];
      const hasActive = subscriptions.length > 0 &&
                       activeStates.some(state => subscriptions[0].estado.includes(state));
      
      setHasActiveSubscription(hasActive);
    } catch (error) {
      console.error("Error checking subscription:", error);
      setHasActiveSubscription(false);
    }
  };

  const checkOnboardingStatus = async () => {
    if (!user || user.user_type !== "professionnel") {
      setNeedsOnboarding(false);
      return;
    }

    const allowedPaths = [
      createPageUrl("ProfileOnboarding"),
      createPageUrl("UserTypeSelection"),
      createPageUrl("MyProfile"), // ✅ NUEVO: Permitir acceso a Mi Perfil
      createPageUrl("PricingPlans"), // ✅ NUEVO: Permitir acceso a Planes
      createPageUrl("SubscriptionManagement"), // ✅ NUEVO: Permitir gestión
      "/logout"
    ];

    if (allowedPaths.includes(location.pathname)) {
      setNeedsOnboarding(false);
      return;
    }

    try {
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: user.id
      });

      // ✅ CORREGIDO: Solo redirigir si NO tiene perfil O si el onboarding no está completado
      // NO redirigir solo porque visible_en_busqueda = false (eso es suscripción cancelada)
      if (!profiles[0] || !profiles[0].onboarding_completed) {
        setNeedsOnboarding(true);
        
        if (location.pathname !== createPageUrl("ProfileOnboarding")) {
          setTimeout(() => {
            navigate(createPageUrl("ProfileOnboarding"));
          }, 2000);
        }
      } else {
        // Usuario tiene perfil completo, aunque esté invisible por falta de suscripción
        setNeedsOnboarding(false);
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setNeedsOnboarding(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
    setUser(null);
    setUnreadCount(0);
  };

  const handleLogin = () => {
    console.log('🔑 Intentando redirigir al login...');
    try {
      if (typeof base44.auth.redirectToLogin === 'function') {
        console.log('✅ Método redirectToLogin existe, llamando...');
        base44.auth.redirectToLogin();
      } else {
        console.warn('⚠️ redirectToLogin no existe, usando método alternativo');
        const loginUrl = `https://app.base44.com/login?app_id=${window.location.hostname}&redirect_uri=${encodeURIComponent(window.location.href)}`;
        console.log('🔗 Redirigiendo a:', loginUrl);
        window.location.href = loginUrl;
      }
    } catch (error) {
      console.error('❌ Error al intentar login:', error);
      alert('Error al iniciar sesión. Intenta recargando la página.');
    }
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

  // ✅ NUEVO: Helper para obtener foto de perfil
  const getProfilePicture = () => {
    return user?.profile_picture || null;
  };

  const navigationItems = [
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
      title: t('favorites'),
      url: createPageUrl("Favorites"),
      icon: Heart,
    },
    {
      title: t('myProfile'),
      url: createPageUrl("MyProfile"),
      icon: User,
    },
  ];

  if (user?.user_type === "professionnel") {
    if (hasActiveSubscription) {
      navigationItems.push({
        title: t('mySubscription'),
        url: createPageUrl("SubscriptionManagement"),
        icon: Briefcase,
      });
    } else {
      navigationItems.push({
        title: t('viewPlans'),
        url: createPageUrl("PricingPlans"),
        icon: CreditCard,
      });
    }
  } else if (!user || user?.user_type === "client") {
    navigationItems.push({
      title: t('viewPlans'),
      url: createPageUrl("PricingPlans"),
      icon: CreditCard,
    });
  }

  if (user?.role === "admin") {
    navigationItems.push({
      title: t('administration'),
      url: createPageUrl("AdminDashboard"),
      icon: LayoutDashboard,
    });
  }

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="bg-white border-yellow-300 shadow-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-gray-800">
              <strong>Completa tu perfil profesional</strong>
              <p className="mt-2">
                Para activar tu cuenta y aparecer en las búsquedas, primero debes completar tu perfil profesional.
              </p>
              <p className="mt-2 text-sm">
                Redirigiendo al quiz en 2 segundos...
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          :root {
            --primary: #1e40af;
            --primary-light: #3b82f6;
            --accent: #f97316;
            --accent-light: #fb923c;
            --background: #f8fafc;
            --card: #ffffff;
          }
          
          /* ✅ Optimización de animaciones */
          * {
            -webkit-tap-highlight-color: transparent;
          }
          
          /* ✅ Smooth scroll optimizado */
          html {
            scroll-behavior: smooth;
          }
          
          /* ✅ Transiciones performantes */
          button, a, [role="button"] {
            transition: transform 150ms ease, opacity 150ms ease;
            will-change: transform, opacity;
          }
          
          button:active, a:active, [role="button"]:active {
            transform: scale(0.98);
          }
          
          /* ✅ Tamaños táctiles correctos (mínimo 48x48px) */
          @media (max-width: 768px) {
            button, a[role="button"], [role="button"] {
              min-height: 48px;
              min-width: 48px;
            }
            
            input, select, textarea {
              font-size: 16px !important;
              padding: 12px !important;
            }
          }
          
          /* ✅ ESTILOS GLOBALES PARA MODALES */
          [role="dialog"],
          [role="alertdialog"],
          .modal-content,
          .dialog-content {
            background-color: #FFFFFF !important;
            color: #222222 !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
            border: 1px solid #E5E7EB !important;
            border-radius: 12px !important;
          }
          
          .modal-header,
          [role="dialog"] h2,
          [role="alertdialog"] h2 {
            background-color: #FFFFFF !important;
            color: #111827 !important;
            font-weight: 700 !important;
            padding: 20px !important;
            border-bottom: 1px solid #E5E7EB !important;
          }
          
          input, select, textarea {
            background-color: #FFFFFF !important;
            color: #222222 !important;
            border: 1px solid #DDD !important;
            border-radius: 6px !important;
          }
          
          input:disabled, select:disabled, textarea:disabled {
            background-color: #F5F5F5 !important;
            color: #888888 !important;
          }
          
          label {
            color: #333333 !important;
            font-weight: 500 !important;
          }
          
          /* ✅ Menú móvil overlay */
          @media (max-width: 1023px) {
            .mobile-menu-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.5);
              z-index: 40;
              animation: fadeIn 200ms ease;
            }
            
            .mobile-menu {
              position: fixed;
              left: 0;
              top: 0;
              bottom: 0;
              width: 80%;
              max-width: 320px;
              background: white;
              z-index: 50;
              animation: slideInLeft 200ms ease;
              overflow-y: auto;
            }
            
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            
            @keyframes slideInLeft {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
          }
          
          /* ✅ BARRA INFERIOR: OCULTA POR DEFECTO, SOLO VISIBLE EN MÓVIL */
          .mobile-bottom-nav {
            display: none !important;
          }
          
          /* Solo visible en móvil (menos de 1024px) */
          @media (max-width: 1023px) {
            .mobile-bottom-nav {
              display: grid !important;
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              background: white;
              border-top: 1px solid #E5E7EB;
              grid-template-columns: repeat(4, 1fr);
              padding: 8px 0;
              z-index: 30;
              box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
            }
            
            .main-content-with-bottom-nav {
              padding-bottom: 80px;
            }
          }
          
          /* Doble seguridad: FORZAR oculto en desktop */
          @media (min-width: 1024px) {
            .mobile-bottom-nav {
              display: none !important;
            }
            
            .main-content-with-bottom-nav {
              padding-bottom: 0 !important;
            }
          }
          
          .mobile-bottom-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 8px;
            color: #6B7280;
            text-decoration: none;
            transition: color 150ms ease;
            position: relative;
          }
          
          .mobile-bottom-nav-item.active {
            color: #1e40af;
          }
          
          .mobile-bottom-nav-item span {
            font-size: 11px;
            font-weight: 500;
          }
          
          .mobile-bottom-nav-badge {
            position: absolute;
            top: 4px;
            right: 20%;
            background: #f97316;
            color: white;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 10px;
            min-width: 18px;
            text-align: center;
          }
        `}
      </style>

      {/* ✅ Scroll to top on route change */}
      <ScrollToTop />

      <SidebarProvider>
        {/* Changed to flex-col to stack main content and cookie banner */}
        <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-slate-50 to-blue-50">
          {/* New div to contain sidebar and main content, taking up available space */}
          <div className="flex flex-1">
            {/* ✅ Desktop Sidebar - SOLO SI HAY USUARIO LOGUEADO */}
            {user && (
              <Sidebar className="border-r border-gray-200 bg-white shadow-sm hidden lg:flex">
                <SidebarHeader className="border-b border-gray-100 p-6">
                  <Link to={createPageUrl("Search")} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/f1c507180_123.png"
                        alt="Misautónomos"
                        className="w-full h-full object-cover"
                        loading="eager"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center"><svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>';
                        }}
                      />
                    </div>
                    <div>
                      <h2 className="font-bold text-xl text-gray-900">Misautónomos</h2>
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
                              <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.title}</span>
                                {item.badge && (
                                  <span className="ml-auto bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
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
                      {/* ✅ MODIFICADO: Avatar con foto de perfil */}
                      <Avatar className="w-10 h-10 border-2 border-blue-600">
                        {getProfilePicture() ? (
                          <img src={getProfilePicture()} alt="Perfil" className="w-full h-full object-cover" />
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
                          {user.user_type === "professionnel" ? "Autónomo" : "Cliente"}
                        </p>
                      </div>
                    </div>
                    
                    {/* ✅ Selector de idioma en sidebar */}
                    <div className="px-2">
                      <LanguageSwitcher variant="compact" />
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('logout')}
                    </Button>
                  </div>
                </SidebarFooter>
              </Sidebar>
            )}

            {/* ✅ MODIFICADO: Mobile Menu con foto */}
            {mobileMenuOpen && (
              <>
                <div 
                  className="mobile-menu-overlay lg:hidden" 
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="mobile-menu lg:hidden">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-bold text-lg">Menú</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="p-3">
                    {user && (
                      <div className="flex items-center gap-3 p-3 mb-4 bg-blue-50 rounded-lg">
                        {/* ✅ NUEVO: Avatar con foto */}
                        <Avatar className="w-10 h-10 border-2 border-blue-600">
                          {getProfilePicture() ? (
                            <img src={getProfilePicture()} alt="Perfil" className="w-full h-full object-cover" />
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
                          <p className="text-xs text-gray-500">
                            {user.user_type === "professionnel" ? "Autónomo" : "Cliente"}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {navigationItems.map((item) => (
                      <Link
                        key={item.title}
                        to={item.url}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                          location.pathname === item.url
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium flex-1">{item.title}</span>
                        {item.badge && (
                          <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                    
                    {/* ✅ Selector de idioma en menú móvil */}
                    <div className="mt-4 mb-4 px-2">
                      <LanguageSwitcher variant="compact" />
                    </div>
                    
                    {!user ? (
                      <div className="mt-4 space-y-2">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={handleLogin}
                        >
                          <User className="w-4 h-4 mr-2" />
                          {t('login')}
                        </Button>
                        <Link to={createPageUrl("PricingPlans")} className="block">
                          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                            <CreditCard className="w-4 h-4 mr-2" />
                            {t('becomeFreelancer')}
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('logout')}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}

            <main className="flex-1 flex flex-col overflow-hidden">
              {/* ✅ Desktop Header - CON NOTIFICACIONES */}
              {!user && (
                <header className="bg-white border-b border-gray-200 px-6 py-4 hidden lg:block sticky top-0 z-20 shadow-sm">
                  <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to={createPageUrl("Search")} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                        <img 
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/f1c507180_123.png"
                          alt="Misautónomos"
                          className="w-full h-full object-cover"
                          loading="eager"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center"><svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>';
                          }}
                        />
                      </div>
                      <div>
                        <h1 className="font-bold text-xl text-gray-900">Misautónomos</h1>
                        <p className="text-xs text-gray-500">{t('tagline')}</p>
                      </div>
                    </Link>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        className="text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                        onClick={handleLogin}
                      >
                        <User className="w-4 h-4 mr-2" />
                        {t('login')}
                      </Button>
                      <Link to={createPageUrl("PricingPlans")}>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-md">
                          <Briefcase className="w-4 h-4 mr-2" />
                          {t('becomeFreelancer')}
                        </Button>
                      </Link>
                      {/* ✅ Selector de idioma a la derecha de "Hazte Autónomo" */}
                      <LanguageSwitcher variant="compact" />
                    </div>
                  </div>
                </header>
              )}

              {/* ✅ Mobile Header - CON NOTIFICACIONES */}
              <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-3 lg:hidden sticky top-0 z-20">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(true)}
                    className="hover:bg-gray-100"
                  >
                    <Menu className="w-6 h-6" />
                  </Button>
                  <h1 className="font-bold text-lg text-gray-900">Misautónomos</h1>
                  <div className="flex items-center gap-2">
                    {user && <NotificationCenter user={user} />}
                    <LanguageSwitcher />
                  </div>
                </div>
              </header>

              {/* ✅ Contenido principal - SOLO agregar padding si se muestra la barra */}
              <div className={`flex-1 overflow-auto ${shouldShowBottomBar() ? 'main-content-with-bottom-nav' : ''}`}>
                {children}
              </div>

              {/* ✅ Footer */}
              <Footer />

              {/* ✅ Mobile Bottom Navigation - NUNCA EN DESKTOP */}
              {shouldShowBottomBar() && (
                <nav className="mobile-bottom-nav">
                  {navigationItems.slice(0, 4).map((item) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`mobile-bottom-nav-item ${
                        location.pathname === item.url ? 'active' : ''
                      }`}
                    >
                      <item.icon className="w-6 h-6" />
                      <span>{item.title.split(' ')[0]}</span>
                      {item.badge && (
                        <span className="mobile-bottom-nav-badge">{item.badge}</span>
                      )}
                    </Link>
                  ))}
                </nav>
              )}
            </main>
          </div>

          {/* ✅ Cookie Banner */}
          <CookieBanner />
        </div>
      </SidebarProvider>
    </>
  );
}

// ✅ Wrapper con LanguageProvider para que el contexto esté disponible
export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}
