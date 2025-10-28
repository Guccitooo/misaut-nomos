import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Star,
  MessageSquare,
  Heart,
  FileText
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewSection from "../components/profile/ReviewSection";
import PhotoGallery from "../components/profile/PhotoGallery";

export default function ProfessionalProfilePage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const professionalId = urlParams.get('id');
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user && professionalId) {
      checkFavorite();
    }
  }, [user, professionalId]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const checkFavorite = async () => {
    try {
      const favorites = await base44.entities.Favorite.filter({
        client_id: user.id,
        professional_id: professionalId
      });
      setIsFavorite(favorites.length > 0);
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', professionalId],
    queryFn: async () => {
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: professionalId
      });
      return profiles[0];
    },
    enabled: !!professionalId,
  });

  const { data: professionalUser } = useQuery({
    queryKey: ['professionalUser', professionalId],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: professionalId });
      return users[0];
    },
    enabled: !!professionalId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', professionalId],
    queryFn: () => base44.entities.Review.filter({ professional_id: professionalId }, '-created_date'),
    enabled: !!professionalId,
    initialData: [],
  });

  const handleToggleFavorite = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    try {
      if (isFavorite) {
        const favorites = await base44.entities.Favorite.filter({
          client_id: user.id,
          professional_id: professionalId
        });
        if (favorites[0]) {
          await base44.entities.Favorite.delete(favorites[0].id);
          setIsFavorite(false);
        }
      } else {
        await base44.entities.Favorite.create({
          client_id: user.id,
          professional_id: professionalId,
          business_name: profile.business_name
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    const conversationId = [user.id, professionalId].sort().join('_');
    navigate(createPageUrl("Messages") + `?conversation=${conversationId}&professional=${professionalId}`);
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900">Profil non trouvé</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with Cover */}
      <div className="relative h-64 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900">
        {profile.photos?.[0] && (
          <img 
            src={profile.photos[0]} 
            alt={profile.business_name}
            className="w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent" />
        
        <div className="absolute top-6 left-6">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => navigate(createPageUrl("Search"))}
            className="bg-white/90 hover:bg-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-20 pb-12">
        {/* Main Info Card */}
        <Card className="mb-6 shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-blue-900 to-blue-700 text-white text-3xl font-bold">
                  {profile.business_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {profile.business_name}
                    </h1>
                    {profile.average_rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= profile.average_rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-lg font-semibold text-gray-700">
                          {profile.average_rating.toFixed(1)}
                        </span>
                        <span className="text-gray-500">
                          ({profile.total_reviews} avis)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleToggleFavorite}
                      className={isFavorite ? "bg-red-50 border-red-300" : ""}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                    <Button 
                      className="bg-blue-900 hover:bg-blue-800"
                      onClick={handleStartChat}
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Contacter
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.categories?.map((cat, idx) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-900">
                      {cat}
                    </Badge>
                  ))}
                  {profile.price_range && (
                    <Badge className="bg-amber-100 text-amber-800">
                      {profile.price_range}
                    </Badge>
                  )}
                </div>

                <p className="text-gray-700 text-lg leading-relaxed">
                  {profile.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            <PhotoGallery photos={profile.photos || []} />

            <ReviewSection 
              reviews={reviews}
              professionalId={professionalId}
              currentUser={user}
            />
          </div>

          {/* Right Column - Contact Info */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-900" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.service_area && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Zone d'intervention</p>
                      <p className="font-medium text-gray-900">{profile.service_area}</p>
                    </div>
                  </div>
                )}

                {profile.opening_hours && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Horaires</p>
                      <p className="font-medium text-gray-900">{profile.opening_hours}</p>
                    </div>
                  </div>
                )}

                {professionalUser?.email && (
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{professionalUser.email}</p>
                    </div>
                  </div>
                )}

                {professionalUser?.phone && (
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-medium text-gray-900">{professionalUser.phone}</p>
                    </div>
                  </div>
                )}

                <Separator />

                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="font-medium">Visiter le site web</span>
                  </a>
                )}

                {profile.social_links && (
                  <div className="flex gap-3">
                    {profile.social_links.facebook && (
                      <a
                        href={profile.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Facebook className="w-6 h-6" />
                      </a>
                    )}
                    {profile.social_links.instagram && (
                      <a
                        href={profile.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-700"
                      >
                        <Instagram className="w-6 h-6" />
                      </a>
                    )}
                    {profile.social_links.linkedin && (
                      <a
                        href={profile.social_links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:text-blue-800"
                      >
                        <Linkedin className="w-6 h-6" />
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {profile.cif_nif && (
              <Card className="shadow-lg border-0 bg-gray-50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-500">CIF / NIF</p>
                  <p className="font-mono font-semibold text-gray-900">{profile.cif_nif}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}