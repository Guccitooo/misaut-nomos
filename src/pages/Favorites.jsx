
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Loader2, TrendingUp } from "lucide-react";

export default function FavoritesPage() {
  const navigate = useNavigate();
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
      base44.auth.redirectToLogin();
    }
  };

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const favs = await base44.entities.Favorite.filter({ client_id: user.id });
      
      const profiles = await Promise.all(
        favs.map(async (fav) => {
          const profile = await base44.entities.ProfessionalProfile.filter({
            user_id: fav.professional_id
          });
          return profile[0] ? { ...profile[0], favoriteId: fav.id } : null;
        })
      );
      
      return profiles.filter(p => p !== null);
    },
    enabled: !!user,
    initialData: [],
  });

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      await base44.entities.Favorite.delete(favoriteId);
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  const handleContact = (professionalId) => {
    const conversationId = [user.id, professionalId].sort().join('_');
    navigate(createPageUrl("Messages") + `?conversation=${conversationId}&professional=${professionalId}`);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Favoritos</h1>
          <p className="text-gray-600">
            Encuentra tus autónomos favoritos
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
          </div>
        ) : favorites.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-lg">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sin favoritos
            </h3>
            <p className="text-gray-600 mb-6">
              Añade autónomos a tus favoritos para encontrarlos fácilmente
            </p>
            <Button
              onClick={() => navigate(createPageUrl("Search"))}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Descubrir autónomos
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((profile) => (
              <Card 
                key={profile.id} 
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white"
              >
                <div 
                  className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden cursor-pointer"
                  onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
                >
                  {profile.photos?.[0] ? (
                    <img 
                      src={profile.photos[0]} 
                      alt={profile.business_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TrendingUp className="w-16 h-16 text-blue-700/20" />
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(profile.favoriteId);
                    }}
                  >
                    <Heart className="w-4 h-4 fill-orange-500 text-orange-500" />
                  </Button>
                </div>

                <CardContent className="p-6">
                  <h3 
                    className="font-bold text-xl text-gray-900 mb-3 cursor-pointer hover:text-blue-700 transition-colors"
                    onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
                  >
                    {profile.business_name}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {profile.description}
                  </p>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleContact(profile.user_id)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contactar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
