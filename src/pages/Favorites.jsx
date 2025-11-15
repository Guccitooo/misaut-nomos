import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Loader2, Star, X, MapPin } from "lucide-react";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import OptimizedImage from "../components/ui/OptimizedImage";

export default function FavoritesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
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

  const { data: rawFavorites = [], isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return base44.entities.Favorite.filter({ client_id: user.id });
    },
    enabled: !!user?.id,
    initialData: [],
  });

  const professionalIds = rawFavorites.map(fav => fav.professional_id);

  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['favoriteProfessionalProfiles', professionalIds],
    queryFn: async () => {
      if (professionalIds.length === 0) return [];
      const allProfiles = await base44.entities.ProfessionalProfile.list();
      return allProfiles.filter(p => professionalIds.includes(p.user_id));
    },
    enabled: professionalIds.length > 0,
    initialData: [],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['favoriteUsers', professionalIds],
    queryFn: async () => {
      if (professionalIds.length === 0) return [];
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => professionalIds.includes(u.id));
    },
    enabled: professionalIds.length > 0,
    initialData: [],
  });

  const isLoading = isLoadingFavorites || isLoadingProfiles || isLoadingUsers;

  const displayFavorites = rawFavorites.filter(fav =>
    profiles.some(p => p.user_id === fav.professional_id)
  );

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      await base44.entities.Favorite.delete(favoriteId);
      queryClient.invalidateQueries(['favorites', user?.id]);
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  const handleStartChat = (professionalId, professionalName) => {
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
    <>
      <SEOHead
        title={`${t('myFavorites')} - MisAutónomos`}
        description="Gestiona tus profesionales favoritos guardados"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('myFavorites')}</h1>
            <p className="text-gray-600">{t('addFavorites')}</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden shadow-none border-0">
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayFavorites.length === 0 ? (
            <Card className="p-12 text-center border-0 shadow-lg">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('noFavorites')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('addFavorites')}
              </p>
              <Button
                onClick={() => navigate(createPageUrl("Search"))}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t('searchFreelancers')}
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayFavorites.map((favorite) => {
                const profile = profiles.find(p => p.user_id === favorite.professional_id);
                const profileUser = users.find(u => u.id === favorite.professional_id);

                if (!profile) return null;

                return (
                  <Card
                    key={favorite.id}
                    className="overflow-hidden hover:shadow-xl transition-shadow border-0 bg-white"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar className="w-12 h-12 border-2 border-blue-600 cursor-pointer"
                          onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
                        >
                          {profileUser?.profile_picture ? (
                            <OptimizedImage
                              src={profileUser.profile_picture}
                              alt={profile.business_name || "Professional profile picture"}
                              className="w-full h-full"
                              objectFit="cover"
                              width={48}
                              height={48}
                            />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold">
                              {profile.business_name ? profile.business_name.charAt(0) : 'P'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <h3
                            className="font-bold text-lg text-gray-900 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
                          >
                            {profile.business_name}
                          </h3>
                          {profile.average_rating > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-semibold">{profile.average_rating.toFixed(1)}</span>
                              <span className="text-xs text-gray-500">({profile.total_reviews})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {profile.categories?.slice(0, 2).map((cat, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {t(cat)}
                          </Badge>
                        ))}
                      </div>

                      {profile.service_area && (
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{profile.service_area}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFavorite(favorite.id)}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          {t('remove')}
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleStartChat(favorite.professional_id, profile.business_name)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {t('contact')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}