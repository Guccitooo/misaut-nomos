import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, MessageSquare, Heart, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import SubscriptionStatus from "./SubscriptionStatus";
import ProfileCompleteness from "./ProfileCompleteness";
import { useLanguage } from "../ui/LanguageSwitcher";

export default function ProfessionalDashboard({ user, onboardingCompleted = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user,
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['professionalProfile', user?.id],
    queryFn: async () => {
      const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: metrics } = useQuery({
    queryKey: ['profileMetrics', user?.id],
    queryFn: async () => {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const allMetrics = await base44.entities.ProfileMetrics.filter({
        professional_id: user.id
      });

      const recentMetrics = allMetrics.filter(m => {
        const metricDate = new Date(m.date);
        return metricDate >= weekAgo;
      });

      return {
        profile_views: recentMetrics.reduce((sum, m) => sum + (m.profile_views || 0), 0),
        messages_received: recentMetrics.reduce((sum, m) => sum + (m.messages_received || 0), 0),
        search_appearances: recentMetrics.reduce((sum, m) => sum + (m.search_appearances || 0), 0),
      };
    },
    enabled: !!user && !!profile,
    initialData: { profile_views: 0, messages_received: 0, search_appearances: 0 }
  });

  const { data: favoriteCount } = useQuery({
    queryKey: ['favoriteCount', user?.id],
    queryFn: async () => {
      const favorites = await base44.entities.Favorite.filter({ professional_id: user.id });
      return favorites.length;
    },
    enabled: !!user,
    initialData: 0
  });

  useEffect(() => {
    if (onboardingCompleted) {
      toast.success(t('profileCompletedAndPublished'), {
        description: t('completeProfileStart'),
        duration: 5000
      });
    }
  }, [onboardingCompleted, t]);

  if (loadingSubscription || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="max-w-2xl mx-auto mt-12">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('noActiveSubscription')}</h2>
            <p className="text-gray-600 mb-6">
              {t('needPlanToAppear')}
            </p>
            <Link to={createPageUrl("PricingPlans")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                {t('viewPlans')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProfileVisible = profile?.visible_en_busqueda && profile?.estado_perfil === 'activo';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 pb-20 lg:pb-4">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('welcomeProfessional', { name: profile?.business_name || user?.full_name || 'Professional' })} 🎉
          </h1>
          <p className="text-gray-600">
            {isProfileVisible 
              ? t('profileActiveVisible')
              : t('completeProfileStart')
            }
          </p>
        </div>

        {/* Status Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <SubscriptionStatus subscription={subscription} />
          <ProfileCompleteness profile={profile} user={user} />
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.profile_views}</p>
                  <p className="text-xs text-gray-600">{t('views7Days')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.messages_received}</p>
                  <p className="text-xs text-gray-600">{t('messages7Days')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Heart className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{favoriteCount}</p>
                  <p className="text-xs text-gray-600">{t('favoritesCount')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.search_appearances}</p>
                  <p className="text-xs text-gray-600">{t('appearances7Days')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow border-2 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('viewPublicProfile')}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('checkHowClientsView')}
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${user.id}`)}
              >
                {t('viewMyProfile')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-2 border-purple-200">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('editProfileDashboard')}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('updateDataPhotos')}
              </p>
              <Button 
                variant="outline"
                className="w-full border-purple-300 hover:bg-purple-50"
                onClick={() => navigate(createPageUrl("MyProfile"))}
              >
                {t('goToMyProfile')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tips Section */}
        {!isProfileVisible && (
          <Card className="mt-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">💡 {t('tipsToStart')}</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">1.</span>
                  <span>{t('completeAllFields')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">2.</span>
                  <span>{t('addAtLeast3Photos')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">3.</span>
                  <span>{t('writeClearDescription')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">4.</span>
                  <span>{t('respondFastMessages')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}