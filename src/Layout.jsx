
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
  Settings
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

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUser();
    loadUnreadCount();
  }, []);

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

  const handleLogout = () => {
    base44.auth.logout();
    setUser(null);
    setUnreadCount(0);
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

  // Add subscription management for professionals
  if (user?.user_type === "professionnel") {
    navigationItems.push({
      title: "Suscripción",
      url: createPageUrl("SubscriptionManagement"),
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
        `}
      </style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar className="border-r border-gray-200 bg-white shadow-sm">
          <SidebarHeader className="border-b border-gray-100 p-6">
            <Link to={createPageUrl("Search")} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-900">milautonomos</h2>
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

            {/* Hazte Autónomo Button */}
            {(!user || user.user_type !== "professionnel") && (
              <div className="mt-auto p-3">
                <Link to={createPageUrl("PricingPlans")}>
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Ver Planes
                  </Button>
                </Link>
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-100 p-4">
            {user && (
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
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 lg:hidden sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors">
                <Menu className="w-6 h-6" />
              </SidebarTrigger>
              <h1 className="text-lg font-bold text-gray-900">milautonomos</h1>
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
