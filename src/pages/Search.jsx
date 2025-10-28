
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
  Image as ImageIcon
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
      const allProfiles = await base44.entities.ProfessionalProfile.list();
      const users = await base44.entities.User.list();
      
      return allProfiles
        .map(profile => {
          const user = users.find(u => u.id === profile.user_id);
          return {
            ...profile,
            subscription_status: user?.subscription_status
          };
        })
        .filter(profile => 
          profile.subscription_status === "actif" && 
          profile.visible_en_busqueda === true &&
          profile.onboarding_completed === true
        );
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

          <div className="max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Buscar servicio, empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-14 text-lg bg-white border-0 shadow-lg"
                  />
                </div>
                <Button className="h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg">
                  <SearchIcon className="w-5 h-5 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>
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
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 bg-white"
                onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
              >
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden">
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
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-xl text-gray-900">
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

                  <div className="flex flex-wrap gap-2 mt-4">
                    {profile.categories?.slice(0, 2).map((cat, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
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
