
import React, { useState, useEffect, useMemo } from "react";
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
  Briefcase,
  Phone,
  MessageCircle,
  MessageSquare,
  User // Added User icon import
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import OptimizedImage from "@/components/ui/OptimizedImage";

// Debounce hook para optimizar búsquedas
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Componente memoizado para tarjetas de perfil
const ProfileCard = React.memo(({ profile, user, onToggleFavorite, onStartChat, navigate }) => {
  const formatPhoneForCall = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      cleaned = '+34' + cleaned;
    }
    return cleaned;
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('34') && cleaned.length === 9) {
      cleaned = '34' + cleaned;
    }
    return cleaned;
  };

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white">
      <div 
        className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden cursor-pointer"
        onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
      >
        {profile.photos && profile.photos.length > 0 ? (
          <OptimizedImage
            src={profile.photos[0]}
            alt={profile.business_name}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Briefcase className="w-16 h-16 text-blue-300 mb-2" />
            <p className="text-sm text-blue-700 font-medium">Sin fotos aún</p>
          </div>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-3 right-3 bg-white/90 hover:bg-white shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(profile.user_id);
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
            {profile.descripcion_corta || profile.description}
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

        {profile.telefono_contacto && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <a
              href={`tel:${formatPhoneForCall(profile.telefono_contacto)}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1"
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
              className="flex-1"
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
                onStartChat(profile.user_id, profile.business_name);
              }}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ProfileCard.displayName = 'ProfileCard';

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      console.log('👤 Usuario autenticado:', currentUser?.email);
    } catch (error) {
      console.log('👤 Usuario no autenticado (visitante)');
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.ServiceCategory.list(),
    staleTime: 1000 * 60 * 10,
    cacheTime: 1000 * 60 * 30,
    initialData: [],
  });

  const { data: profiles = [], isLoading: loadingProfiles, error: profilesError } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      console.log('🚀 ============ INICIO CARGA PERFILES ============');
      console.log('🔵 Usuario actual:', user?.email || 'VISITANTE SIN LOGIN');
      
      try {
        console.log('📞 Llamando a base44.entities.ProfessionalProfile.list()...');
        
        const allProfiles = await base44.entities.ProfessionalProfile.list('-updated_date', 100);
        
        console.log('✅ Respuesta recibida!');
        console.log('📦 Total perfiles en BD:', allProfiles?.length || 0);
        
        if (!allProfiles || allProfiles.length === 0) {
          console.warn('⚠️ NO HAY PERFILES EN LA BASE DE DATOS');
          return [];
        }

        console.log('✅ DEVOLVIENDO TODOS LOS PERFILES SIN FILTRAR');
        console.log('📊 Total a mostrar:', allProfiles.length);
        
        return allProfiles;
        
      } catch (error) {
        console.error('❌ ============ ERROR EN CARGA ============');
        console.error('❌ Tipo de error:', error.constructor.name);
        console.error('❌ Mensaje:', error.message);
        console.error('❌ Stack:', error.stack);
        throw error;
      }
    },
    staleTime: 0,
    cacheTime: 0,
    initialData: [],
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const filteredProfiles = useMemo(() => {
    console.log('🔍 Aplicando filtros...');
    console.log('🔍 Profiles antes de filtrar:', profiles.length);
    
    const filtered = profiles.filter(profile => {
      const matchesSearch = !debouncedSearchTerm || 
        profile.business_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        profile.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        profile.descripcion_corta?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
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
      if (sortBy === "recent") {
        return new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime();
      }
      return 0;
    });
    
    console.log('🔍 Profiles después de filtrar:', filtered.length);
    return filtered;
  }, [profiles, debouncedSearchTerm, selectedCategory, selectedCity, selectedPriceRange, sortBy]);

  const cities = useMemo(() => 
    [...new Set(profiles.map(p => p.service_area).filter(Boolean))],
    [profiles]
  );

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
    
    const existingMessages = await base44.entities.Message.filter({
      conversation_id: conversationId
    });

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

  console.log('🎨 ============ RENDER ============');
  console.log('🎨 Loading:', loadingProfiles);
  console.log('🎨 Profiles:', profiles.length);
  console.log('🎨 Filtered:', filteredProfiles.length);
  console.log('🎨 Error:', profilesError);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section - ✅ VERSIÓN COMPACTA */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white py-12 px-4 shadow-xl">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
              Encuentra el autónomo perfecto
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-6">
              Profesionales cualificados y verificados en toda España
            </p>
            
            {/* ✅ CAMBIO: Versión compacta sin textos explicativos */}
            {!isLoadingUser && !user && (
              <div className="space-y-3">
                <p className="text-base text-blue-100 font-medium">
                  Elige cómo quieres empezar:
                </p>
                <div className="flex flex-row gap-3 justify-center items-center">
                  <Link to={createPageUrl("PricingPlans")} className="flex-1 max-w-xs">
                    <Button 
                      size="lg" 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-xl transition-all hover:scale-105"
                    >
                      <Briefcase className="w-5 h-5 mr-2" />
                      🧰 Soy autónomo
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Search")} className="flex-1 max-w-xs" onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      base44.auth.redirectToLogin(window.location.href);
                    }
                  }}>
                    <Button 
                      size="lg" 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-xl transition-all hover:scale-105"
                    >
                      <SearchIcon className="w-5 h-5 mr-2" />
                      👤 Soy cliente
                    </Button>
                  </Link>
                </div>
              </div>
            )}
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
            {loadingProfiles ? 'Cargando...' : `${filteredProfiles.length} autónomos disponibles`}
          </h2>
          <p className="text-gray-600">
            Profesionales verificados y listos para ayudarte
          </p>
          {profilesError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-semibold">
                ⚠️ Error al cargar perfiles: {profilesError.message}
              </p>
              <p className="text-red-600 text-xs mt-2">
                Abre la consola del navegador (F12) para ver más detalles
              </p>
            </div>
          )}
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
              <ProfileCard
                key={profile.id}
                profile={profile}
                user={user}
                onToggleFavorite={handleToggleFavorite}
                onStartChat={handleStartChat}
                navigate={navigate}
              />
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
              {profiles.length === 0 
                ? 'No hay perfiles en la base de datos. Contacta con el administrador.'
                : 'Intenta modificar tus criterios de búsqueda'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
