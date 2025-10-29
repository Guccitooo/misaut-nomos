
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
  AlertCircle
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

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    loadUser();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    checkOnboardingStatus();
    checkSubscriptionStatus();
  }, [user, location.pathname]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
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
                       activeStates.includes(subscriptions[0].estado);
      
      setHasActiveSubscription(hasActive);
      console.log('💳 Suscripción activa:', hasActive);
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

      if (!profiles[0] || !profiles[0].onboarding_completed || !profiles[0].visible_en_busqueda) {
        setNeedsOnboarding(true);
        
        setTimeout(() => {
          navigate(createPageUrl("ProfileOnboarding"));
        }, 2000);
      } else {
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

  const navigationItems = [
    {
      title: "Buscar Autónomos",
      url: createPageUrl("Search"),
      icon: Search,
    },
    {
      title: "Mensajes",
      url: createPageUrl("Messages"),
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      title: "Favoritos",
      url: createPageUrl("Favorites"),
      icon: Heart,
    },
    {
      title: "Mi Perfil",
      url: createPageUrl("MyProfile"),
      icon: User,
    },
  ];

  if (user?.user_type === "professionnel") {
    if (hasActiveSubscription) {
      navigationItems.push({
        title: "Mi Suscripción",
        url: createPageUrl("SubscriptionManagement"),
        icon: Briefcase,
      });
    } else {
      navigationItems.push({
        title: "Ver Planes",
        url: createPageUrl("PricingPlans"),
        icon: CreditCard,
      });
    }
  } else if (!user || user?.user_type === "client") {
    navigationItems.push({
      title: "Ver Planes",
      url: createPageUrl("PricingPlans"),
      icon: CreditCard,
    });
  }

  if (user?.role === "admin") {
    navigationItems.push({
      title: "Administración",
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
    <SidebarProvider>
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
          
          /* Fondo blanco sólido para todos los modales y diálogos */
          [role="dialog"],
          [role="alertdialog"],
          .modal-content,
          .dialog-content,
          .popover-content {
            background-color: #FFFFFF !important;
            color: #222222 !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
          }
          
          /* Inputs, selects y textareas con fondo blanco */
          input, select, textarea {
            background-color: #FFFFFF !important;
            color: #222222 !important;
            border: 1px solid #DDD !important;
          }
          
          input:disabled, select:disabled, textarea:disabled {
            background-color: #F5F5F5 !important;
            color: #888888 !important;
          }
          
          /* Labels y textos oscuros */
          label {
            color: #333333 !important;
          }
        `}
      </style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar className="border-r border-gray-200 bg-white shadow-sm">
          <SidebarHeader className="border-b border-gray-100 p-6">
            <Link to={createPageUrl("Search")} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/f1c507180_123.png"
                  alt="MilAutónomos"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center"><svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>';
                  }}
                />
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-900">MilAutónomos</h2>
                <p className="text-xs text-gray-500">Tu autónomo de confianza</p>
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
                        className={`hover:bg-blue-50 hover:text-blue-900 transition-all duration-200 rounded-xl mb-1 relative ${
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

            {!user && (
              <div className="mt-auto p-3">
                <Link to={createPageUrl("UserTypeSelection")}>
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Hazte Autónomo
                  </Button>
                </Link>
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-100 p-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <Avatar className="w-10 h-10 border-2 border-blue-600">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white font-semibold">
                      {user.full_name?.charAt(0) || user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.user_type === "professionnel" ? "Autónomo" : "Cliente"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleLogin}
                >
                  <User className="w-4 h-4 mr-2" />
                  Iniciar sesión
                </Button>
                <p className="text-xs text-center text-gray-500">
                  Inicia sesión para acceder a tu cuenta
                </p>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 lg:hidden sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors">
                <Menu className="w-6 h-6" />
              </SidebarTrigger>
              <h1 className="text-lg font-bold text-gray-900">MilAutónomos</h1>
              <div className="w-10" />
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
