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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Footer from "@/components/ui/Footer";
import CookieBanner from "@/components/ui/CookieBanner";
import LanguageSwitcher, { useLanguage, LanguageProvider } from "@/components/ui/LanguageSwitcher";
import ScrollToTop from "@/components/ui/ScrollToTop";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import OptimizedImage from "@/components/ui/OptimizedImage";

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [professionalProfile, setProfessionalProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (window.gtag) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-P9DN7YN239';
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('consent', 'default', {
      'analytics_storage': 'denied',
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'functionality_storage': 'granted',
      'security_storage': 'granted'
    });

    gtag('js', new Date());
    gtag('config', 'G-P9DN7YN239', {
      'send_page_view': false
    });
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
    createPageUrl("UserTypeSelection"),
    createPageUrl("ProfileOnboarding"),
    createPageUrl("ClientOnboarding"),
    createPageUrl("PricingPlans"),
    createPageUrl("Onboarding")
  ];

  const shouldShowBottomBar = () => {
    if (!user) return false;
    if (hideBottomBarRoutes.includes(location.pathname)) return false;
    if (!user.user_type) return false;
    
    if (user.user_type === "professionnel") {
      if (professionalProfile === null) return false;
      if (!professionalProfile.onboarding_completed || !professionalProfile.visible_en_busqueda) {
        return false;
      }
    }
    
    return true;
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
    }
  }, [user]);

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
          setProfessionalProfile(undefined);
        }
      } else {
        setProfessionalProfile(undefined);
      }
    } catch (error) {
      setUser(null);
      setProfessionalProfile(undefined);
    } finally {
      setLoadingUser(false);
    }
  };

  const isProfessional = user && (user.user_type === "professionnel" || professionalProfile);

  const loadUnreadCount = async () => {
    try {
      const messages = await base44.entities.Message.filter({
        recipient_id: user.id,
        is_read: false
      });
      setUnreadCount(messages.length);
    } catch (error) {
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
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

  if (isProfessional) {
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

  if (user?.role === "admin") {
    navigationItems.push({
      title: t('administration'),
      url: createPageUrl("AdminDashboard"),
      icon: LayoutDashboard,
    });
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          :root {
            --primary: #1D4ED8;
            --primary-dark: #1E40AF;
            --primary-light: #3B82F6;
            --success: #22C55E;
            --success-dark: #16A34A;
            --warning: #F59E0B;
            --error: #EF4444;
            --error-dark: #DC2626;
            --gray-bg: #F3F4F6;
            --gray-border: #E5E7EB;
            --gray-text: #6B7280;
            --text-dark: #111827;
          }
          
          * {
            -webkit-tap-highlight-color: transparent;
          }
          
          html {
            scroll-behavior: smooth;
          }
          
          button, a, [role="button"] {
            transition: transform 150ms ease, opacity 150ms ease;
            will-change: transform, opacity;
          }
          
          button:active, a:active, [role="button"]:active {
            transform: scale(0.98);
          }
          
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
          
          [data-radix-dialog-overlay],
          [data-radix-alert-dialog-overlay],
          .dialog-overlay,
          .modal-overlay {
            background-color: rgba(0, 0, 0, 0.6) !important;
            backdrop-filter: blur(4px);
            animation: fadeIn 200ms ease-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { 
              opacity: 0;
              transform: translate(-50%, -48%) scale(0.96);
            }
            to { 
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
          
          [role="dialog"],
          [role="alertdialog"],
          [data-radix-dialog-content],
          [data-radix-alert-dialog-content],
          .modal-content,
          .dialog-content {
            background-color: #FFFFFF !important;
            color: #1F2937 !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
            border: 1px solid #E5E7EB !important;
            border-radius: 16px !important;
            animation: slideIn 250ms ease-out;
            max-height: 90vh;
            overflow-y: auto;
          }
          
          [role="dialog"] h2,
          [role="alertdialog"] h2,
          [data-dialog-title],
          .dialog-header h2,
          .modal-header {
            background-color: transparent !important;
            color: #111827 !important;
            font-weight: 700 !important;
            font-size: 1.5rem !important;
            line-height: 1.3 !important;
            margin-bottom: 0.5rem !important;
          }
          
          [role="dialog"] p,
          [role="alertdialog"] p,
          [data-dialog-description],
          .dialog-description {
            color: #4B5563 !important;
            line-height: 1.6 !important;
          }
          
          [role="dialog"] input,
          [role="dialog"] select,
          [role="dialog"] textarea,
          [role="alertdialog"] input,
          [role="alertdialog"] select,
          [role="alertdialog"] textarea {
            background-color: #FFFFFF !important;
            color: #1F2937 !important;
            border: 2px solid #D1D5DB !important;
            border-radius: 8px !important;
            padding: 12px !important;
            font-size: 16px !important;
          }
          
          [role="dialog"] input:focus,
          [role="dialog"] select:focus,
          [role="dialog"] textarea:focus {
            border-color: #3B82F6 !important;
            outline: none !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
          }
          
          [role="dialog"] input:disabled,
          [role="dialog"] select:disabled,
          [role="dialog"] textarea:disabled {
            background-color: #F3F4F6 !important;
            color: #9CA3AF !important;
            cursor: not-allowed !important;
          }
          
          [role="dialog"] label,
          [role="alertdialog"] label {
            color: #374151 !important;
            font-weight: 600 !important;
            font-size: 14px !important;
            margin-bottom: 8px !important;
            display: block !important;
          }
          
          [role="dialog"] button,
          [role="alertdialog"] button {
            font-weight: 600 !important;
            border-radius: 10px !important;
            transition: all 150ms ease !important;
          }
          
          [data-radix-popper-content-wrapper],
          [data-radix-select-content],
          [data-radix-dropdown-menu-content],
          .popover-content,
          .select-content,
          .dropdown-content {
            background-color: #FFFFFF !important;
            border: 1px solid #E5E7EB !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
            z-index: 100 !important;
          }
          
          [data-radix-select-item],
          .select-item {
            color: #1F2937 !important;
            padding: 10px 12px !important;
            cursor: pointer !important;
            transition: background-color 150ms ease !important;
          }
          
          [data-radix-select-item]:hover,
          .select-item:hover {
            background-color: #EFF6FF !important;
            color: #1E40AF !important;
          }
          
          [data-radix-select-item][data-state="checked"],
          .select-item[data-state="checked"] {
            background-color: #DBEAFE !important;
            color: #1E40AF !important;
            font-weight: 600 !important;
          }
          
          @media (max-width: 1023px) {
            .mobile-menu-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.6) !important;
              backdrop-filter: blur(4px);
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
              background: #FFFFFF !important;
              z-index: 50;
              animation: slideInLeft 200ms ease;
              overflow-y: auto;
              box-shadow: 10px 0 40px rgba(0, 0, 0, 0.3);
            }
            
            @keyframes slideInLeft {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
          }
          
          .mobile-bottom-nav {
            display: none !important;
          }
          
          @media (max-width: 1023px) {
            .mobile-bottom-nav {
              display: grid !important;
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              background: #FFFFFF !important;
              border-top: 2px solid #E5E7EB !important;
              grid-template-columns: repeat(4, 1fr);
              padding: 8px 0;
              z-index: 30;
              box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1) !important;
            }
            
            .main-content-with-bottom-nav {
              padding-bottom: 80px;
            }
          }
          
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
            color: #1D4ED8;
          }
          
          .mobile-bottom-nav-item span {
            font-size: 11px;
            font-weight: 500;
          }
          
          .mobile-bottom-nav-badge {
            position: absolute;
            top: 4px;
            right: 20%;
            background: #EF4444;
            color: white;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 10px;
            min-width: 18px;
            text-align: center;
          }
          
          button:focus-visible,
          a:focus-visible,
          [role="button"]:focus-visible {
            outline: 2px solid #3B82F6 !important;
            outline-offset: 2px !important;
          }
          
          [role="dialog"],
          [role="alertdialog"] {
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
          
          [role="dialog"]::-webkit-scrollbar,
          [role="alertdialog"]::-webkit-scrollbar {
            width: 8px;
          }
          
          [role="dialog"]::-webkit-scrollbar-track,
          [role="alertdialog"]::-webkit-scrollbar-track {
            background: #F3F4F6;
            border-radius: 10px;
          }
          
          [role="dialog"]::-webkit-scrollbar-thumb,
          [role="alertdialog"]::-webkit-scrollbar-thumb {
            background: #D1D5DB;
            border-radius: 10px;
          }
          
          [role="dialog"]::-webkit-scrollbar-thumb:hover,
          [role="alertdialog"]::-webkit-scrollbar-thumb:hover {
            background: #9CA3AF;
          }
        `}
      </style>

      <ScrollToTop />

      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="flex flex-1">
            {user && (
              <Sidebar className="border-r border-gray-200 bg-white shadow-sm hidden lg:flex">
                <SidebarHeader className="border-b border-gray-100 p-6">
                  <Link to={createPageUrl("Search")} className="flex items-center gap-3" aria-label="Ir a búsqueda de profesionales">
                    <img
                      src={LOGO_URL}
                      alt="Logo MisAutónomos"
                      className="w-12 h-12 rounded-lg"
                      loading="eager"
                      fetchpriority="high"
                      decoding="sync"
                      width={48}
                      height={48}
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
                      <Avatar className="w-10 h-10 border-2 border-blue-600">
                        {getProfilePicture() ? (
                          <OptimizedImage 
                            src={getProfilePicture()} 
                            alt={`Foto de perfil de ${getDisplayName()}`}
                            className="w-full h-full object-cover"
                            priority={true}
                            width={40}
                            height={40}
                          />
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
                    
                    <div className="px-2">
                      <LanguageSwitcher variant="compact" />
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                      onClick={handleLogout}
                      aria-label={t('logout')}
                    >
                      <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                      {t('logout')}
                    </Button>
                  </div>
                </SidebarFooter>
              </Sidebar>
            )}

            {mobileMenuOpen && (
              <>
                <div 
                  className="mobile-menu-overlay lg:hidden" 
                  onClick={() => setMobileMenuOpen(false)}
                  role="presentation"
                  aria-hidden="true"
                />
                <nav className="mobile-menu lg:hidden" role="dialog" aria-label="Menú de navegación">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-bold text-lg">Menú</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Cerrar menú"
                    >
                      <X className="w-5 h-5" aria-hidden="true" />
                    </Button>
                  </div>
                  
                  <div className="p-3">
                    {user && (
                      <div className="flex items-center gap-3 p-3 mb-4 bg-blue-50 rounded-lg">
                        <Avatar className="w-10 h-10 border-2 border-blue-600">
                          {getProfilePicture() ? (
                            <OptimizedImage 
                              src={getProfilePicture()} 
                              alt={`Foto de perfil de ${getDisplayName()}`}
                              className="w-full h-full object-cover"
                              priority={true}
                              width={40}
                              height={40}
                            />
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
                            {isProfessional ? t('professional') : t('client')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {user && navigationItems.map((item) => (
                      <Link
                        key={item.title}
                        to={item.url}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                          location.pathname === item.url
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                        aria-label={item.title}
                      >
                        <item.icon className="w-5 h-5" aria-hidden="true" />
                        <span className="font-medium flex-1">{item.title}</span>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold" aria-label={`${item.badge} ${t('unread')}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )))}
                    
                    {user && (
                      <div className="mt-4 mb-4 px-2">
                        <LanguageSwitcher variant="compact" />
                      </div>
                    )}
                    
                    {!user ? (
                      <div className="mt-4 space-y-2">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={handleLogin}
                          aria-label={t('login')}
                        >
                          <User className="w-4 h-4 mr-2" aria-hidden="true" />
                          {t('login')}
                        </Button>
                        <Link to={createPageUrl("ClientOnboarding")} className="block">
                          <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                            <User className="w-4 h-4 mr-2" aria-hidden="true" />
                            Hazte cliente
                          </Button>
                        </Link>
                        <Link to={createPageUrl("PricingPlans")} className="block">
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <CreditCard className="w-4 h-4 mr-2" aria-hidden="true" />
                            {t('becomeFreelancer')}
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={handleLogout}
                        aria-label={t('logout')}
                      >
                        <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                        {t('logout')}
                      </Button>
                    )}
                  </div>
                </nav>
              </>
            )}

            <main className="flex-1 flex flex-col overflow-hidden">
              {!user && (
                <header className="bg-white border-b border-gray-200 px-6 py-4 hidden lg:block sticky top-0 z-20 shadow-sm">
                  <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to={createPageUrl("Search")} className="flex items-center gap-3" aria-label="Ir a búsqueda">
                      <img
                        src={LOGO_URL}
                        alt="Logo MisAutónomos"
                        className="w-12 h-12 rounded-lg"
                        loading="eager"
                        fetchpriority="high"
                        decoding="sync"
                        width={48}
                        height={48}
                      />
                      <div>
                        <h1 className="font-bold text-xl text-gray-900">MisAutónomos</h1>
                        <p className="text-xs text-gray-500">{t('tagline')}</p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        className="text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                        onClick={handleLogin}
                        aria-label={t('login')}
                      >
                        <User className="w-4 h-4 mr-2" aria-hidden="true" />
                        {t('login')}
                      </Button>
                      <Link to={createPageUrl("ClientOnboarding")}>
                        <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                          <User className="w-4 h-4 mr-2" aria-hidden="true" />
                          Hazte cliente
                        </Button>
                      </Link>
                      <Link to={createPageUrl("PricingPlans")}>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                          <Briefcase className="w-4 h-4 mr-2" aria-hidden="true" />
                          {t('becomeFreelancer')}
                        </Button>
                      </Link>
                      <LanguageSwitcher variant="compact" />
                    </div>
                  </div>
                </header>
              )}

              <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-3 lg:hidden sticky top-0 z-20">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(true)}
                    className="hover:bg-gray-100"
                    aria-label="Abrir menú"
                  >
                    <Menu className="w-6 h-6" aria-hidden="true" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <img
                      src={LOGO_URL}
                      alt="Logo MisAutónomos"
                      className="w-8 h-8 rounded"
                      loading="eager"
                      fetchpriority="high"
                      width={32}
                      height={32}
                    />
                    <h1 className="font-bold text-lg text-gray-900">MisAutónomos</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    {user && <NotificationCenter user={user} />}
                    <LanguageSwitcher />
                  </div>
                </div>
              </header>

              <div className={`flex-1 overflow-auto ${shouldShowBottomBar() ? 'main-content-with-bottom-nav' : ''}`}>
                {children}
              </div>

              <Footer />

              {shouldShowBottomBar() && (
                <nav className="mobile-bottom-nav" role="navigation" aria-label="Navegación principal">
                  {navigationItems.slice(0, 4).map((item) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`mobile-bottom-nav-item ${
                        location.pathname === item.url ? 'active' : ''
                      }`}
                      aria-label={item.title}
                      aria-current={location.pathname === item.url ? 'page' : undefined}
                    >
                      <item.icon className="w-6 h-6" aria-hidden="true" />
                      <span>{item.title.split(' ')[0]}</span>
                      {item.badge && (
                        <span className="mobile-bottom-nav-badge" aria-label={`${item.badge} ${t('unread')}`}>{item.badge}</span>
                      )}
                      </Link>
                      ))}
                </nav>
              )}
            </main>
          </div>

          <CookieBanner />
        </div>
      </SidebarProvider>
    </>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}