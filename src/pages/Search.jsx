
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search as SearchIcon,
  MapPin,
  Star,
  Heart,
  Filter,
  TrendingUp,
  Briefcase,
  Image as ImageIcon,
  Phone, // Added Phone icon
  MessageCircle, // Added MessageCircle icon
  MessageSquare // Added MessageSquare icon for direct chat
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.ServiceCategory.list(),
    initialData: [],
  });

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      console.log("🔍 Cargando perfiles...");
      
      const allProfiles = await base44.entities.ProfessionalProfile.list();
      console.log("📦 Total perfiles en DB:", allProfiles.length);
      console.log("📋 Perfiles completos:", allProfiles);
      
      const users = await base44.entities.User.list();
      console.log("👥 Total usuarios:", users.length);
      
      const profilesWithStatus = allProfiles.map(profile => {
        const user = users.find(u => u.id === profile.user_id);
        const profileData = {
          ...profile,
          subscription_status: user?.subscription_status,
        };
        
        // Debug cada perfil
        console.log(`\n📊 Perfil: ${profile.business_name}`);
        console.log(`   user_id: ${profile.user_id}`);
        console.log(`   usuario encontrado: ${user ? 'SÍ' : 'NO'}`);
        console.log(`   subscription_status: ${user?.subscription_status}`);
        console.log(`   visible_en_busqueda: ${profile.visible_en_busqueda}`);
        console.log(`   onboarding_completed: ${profile.onboarding_completed}`);
        console.log(`   estado_perfil: ${profile.estado_perfil}`);
        
        return profileData;
      });

      console.log("📊 Perfiles con status:", profilesWithStatus);

      const visibleProfiles = profilesWithStatus.filter(profile => {
        const hasActiveSubscription = 
          profile.subscription_status === "actif" || 
          profile.subscription_status === "en_prueba";
        const isVisible = profile.visible_en_busqueda === true;
        const isCompleted = profile.onboarding_completed === true;
        
        const passes = hasActiveSubscription && isVisible && isCompleted;
        
        console.log(`\n🔎 Filtro para ${profile.business_name}:`);
        console.log(`   ✓ Suscripción activa: ${hasActiveSubscription} (${profile.subscription_status})`);
        console.log(`   ✓ Visible: ${isVisible}`);
        console.log(`   ✓ Onboarding completado: ${isCompleted}`);
        console.log(`   ➡️ PASA FILTRO: ${passes ? '✅ SÍ' : '❌ NO'}`);

        return passes;
      });

      console.log("✅ Perfiles que pasan filtro:", visibleProfiles.length);
      console.log("📋 Perfiles visibles finales:", visibleProfiles);
      
      return visibleProfiles;
    },
    initialData: [],
  });

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = !searchTerm || 
      profile.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      profile.categories?.includes(selectedCategory);
    
    const matchesCity = selectedCity === "all" || 
      profile.service_area?.toLowerCase().includes(selectedCity.toLowerCase());
    
    const matchesPriceRange = selectedPriceRange === "all" || 
      profile.price_range === selectedPriceRange;
    
    return matchesSearch && matchesCategory && matchesCity && matchesPriceRange;
  }).sort((a, b) => {
    if (sortBy === "rating") {
      return (b.average_rating || 0) - (a.average_rating || 0);
    }
    // Implement other sort options if needed
    // For "recent" you might need a `created_at` or `updated_at` field
    // For now, if not rating, no specific sort is applied
    return 0;
  });

  const cities = [...new Set(profiles.map(p => p.service_area).filter(Boolean))];

  const handleToggleFavorite = async (professionalId) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    try {
      const favorites = await base44.entities.Favorite.filter({
        client_id: user.id,
        professional_id: professionalId
      });

      if (favorites.length > 0) {
        await base44.entities.Favorite.delete(favorites[0].id);
      } else {
        const profile = profiles.find(p => p.user_id === professionalId);
        await base44.entities.Favorite.create({
          client_id: user.id,
          professional_id: professionalId,
          business_name: profile.business_name
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleStartChat = async (professionalId, businessName) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    const conversationId = [user.id, professionalId].sort().join('_');
    
    // Check if conversation exists
    const existingMessages = await base44.entities.Message.filter({
      conversation_id: conversationId
    });

    // If no messages, create initial message
    if (existingMessages.length === 0) {
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: professionalId,
        content: "Hola, estoy interesado en tus servicios.",
        professional_name: businessName,
        client_name: user.full_name || user.email,
        is_read: false
      });
    }

    navigate(createPageUrl("Messages") + `?conversation=${conversationId}&professional=${professionalId}`);
  };

  const formatPhoneForCall = (phone) => {
    if (!phone) return null;
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    // Add +34 if no prefix exists and it looks like a local number
    if (!cleaned.startsWith('+')) {
      cleaned = '+34' + cleaned;
    }
    return cleaned;
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    // Add 34 if no prefix exists and it's a typical Spanish 9-digit number
    if (!cleaned.startsWith('34') && cleaned.length === 9) {
      cleaned = '34' + cleaned;
    }
    return cleaned;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white py-16 px-4 shadow-xl">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Encuentra el autónomo perfecto
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-6">
              Profesionales cualificados y verificados en toda España
            </p>
            
            {/* CTA Button for professionals */}
            <Link to={createPageUrl("PricingPlans")}>
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-xl">
                <Briefcase className="w-5 h-5 mr-2" />
                ¿Eres autónomo? Únete ahora
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-blue-700" />
              <h2 className="font-semibold text-lg text-gray-900">Filtros</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar servicio, empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Ciudad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ciudades</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Precio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los precios</SelectItem>
                  <SelectItem value="€">€ - Económico</SelectItem>
                  <SelectItem value="€€">€€ - Medio</SelectItem>
                  <SelectItem value="€€€">€€€ - Premium</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Mejores valorados</SelectItem>
                  <SelectItem value="recent">Más recientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {filteredProfiles.length} autónomos disponibles
          </h2>
          <p className="text-gray-600">
            Profesionales verificados y listos para ayudarte
          </p>
          
          {/* Debug info */}
          <div className="mt-2 text-xs text-gray-500">
            <p>Total en DB: {profiles.length} perfiles cargados</p>
          </div>
        </div>

        {loadingProfiles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <Card 
                key={profile.id} 
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white"
              >
                <div 
                  className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden cursor-pointer"
                  onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
                >
                  {profile.photos && profile.photos.length > 0 ? (
                    <img 
                      src={profile.photos[0]} 
                      alt={profile.business_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-blue-300 mb-2" />
                      <p className="text-sm text-blue-700 font-medium">Sin fotos aún</p>
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(profile.user_id);
                    }}
                  >
                    <Heart className="w-4 h-4 text-orange-500" />
                  </Button>
                </div>

                <CardContent className="p-6">
                  <div 
                    className="cursor-pointer"
                    onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-xl text-gray-900 hover:text-blue-700 transition-colors">
                        {profile.business_name}
                      </h3>
                      {profile.price_range && (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                          {profile.price_range}
                        </Badge>
                      )}
                    </div>

                    {profile.average_rating > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= profile.average_rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                          {profile.average_rating.toFixed(1)} ({profile.total_reviews} {profile.total_reviews === 1 ? 'opinión' : 'opiniones'})
                        </span>
                      </div>
                    )}

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {profile.description}
                    </p>

                    {profile.service_area && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.service_area}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.categories?.slice(0, 2).map((cat, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  {profile.telefono_contacto && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <a
                        href={`tel:${formatPhoneForCall(profile.telefono_contacto)}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button 
                          variant="outline" 
                          className="w-full hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600"
                          size="sm"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </a>
                      <a
                        href={`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </a>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChat(profile.user_id, profile.business_name);
                        }}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loadingProfiles && filteredProfiles.length === 0 && (
          <Card className="p-12 text-center border-0 shadow-lg">
            <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-gray-600">
              Intenta modificar tus criterios de búsqueda
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
