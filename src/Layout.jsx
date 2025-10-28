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
  Settings,
  LayoutDashboard
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
    }
  };

  const loadUnreadCount = async () => {
    try {
      const currentUser = await base44.auth.me();
      const messages = await base44.entities.Message.filter({
        recipient_id: currentUser.id,
        is_read: false
      });
      setUnreadCount(messages.length);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const navigationItems = [
    {
      title: "Rechercher",
      url: createPageUrl("Search"),
      icon: Search,
    },
    {
      title: "Messages",
      url: createPageUrl("Messages"),
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      title: "Favoris",
      url: createPageUrl("Favorites"),
      icon: Heart,
    },
    {
      title: "Mon Profil",
      url: createPageUrl("MyProfile"),
      icon: User,
    },
  ];

  if (user?.role === "admin") {
    navigationItems.push({
      title: "Administration",
      url: createPageUrl("AdminDashboard"),
      icon: LayoutDashboard,
    });
  }

  return (
    <SidebarProvider>
      <style>
        {`
          :root {
            --primary: #1e3a8a;
            --primary-light: #3b82f6;
            --accent: #f59e0b;
            --accent-light: #fbbf24;
            --background: #f8fafc;
            --card: #ffffff;
          }
        `}
      </style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar className="border-r border-gray-200 bg-white shadow-sm">
          <SidebarHeader className="border-b border-gray-100 p-6">
            <Link to={createPageUrl("Search")} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-900">ProConnect</h2>
                <p className="text-xs text-gray-500">Trouvez votre expert</p>
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
                          location.pathname === item.url ? 'bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-md' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto bg-amber-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
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
            {user && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <Avatar className="w-10 h-10 border-2 border-blue-900">
                    <AvatarFallback className="bg-gradient-to-br from-blue-900 to-blue-700 text-white font-semibold">
                      {user.full_name?.charAt(0) || user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.user_type === "professionnel" ? "Professionnel" : "Client"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
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
              <h1 className="text-lg font-bold text-gray-900">ProConnect</h1>
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