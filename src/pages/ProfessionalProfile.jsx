import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  MapPin, Euro, Globe, Heart, Phone, MessageCircle,
  Facebook, Instagram, Linkedin, Star, Award, Loader2,
  AlertCircle, X, Music, Copy, Check, ArrowLeft,
  ChevronLeft, ChevronRight, Share2, CheckCircle2,
  Zap, Clock, ImageIcon
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import ReviewSection from "../components/profile/ReviewSection";
import SEOHead from "../components/seo/SEOHead";
import { LocalBusinessSchema } from "../components/seo/StructuredData";
import { toast } from "sonner";
import { useLanguage } from "../components/ui/LanguageSwitcher";

// Helper: limpiar teléfono para WhatsApp
const cleanPhone = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('34') && cleaned.length === 9) {
    cleaned = '34' + cleaned;
  }
  return cleaned;
};

const cleanPhoneForCall = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) cleaned = '+34' + cleaned;
  return cleaned;
};

// Mini componente ReviewCard
const ReviewCard = ({ review }) => {
  const stars = review.rating ? Math.round(review.rating) : 0;
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-900 text-sm">{review.client_name || "Cliente"}</span>
        <div className="flex items-center gap-0.5">
          {[1,2,3,4,5].map(s => (
            <Star key={s} className={`w-3.5 h-3.5 ${s <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
          ))}
        </div>
      </div>
      {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
    </div>
  );
};

export default function ProfessionalProfilePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const professionalId = urlParams.get("id");

  useEffect(() => { loadUser(); }, []);
  useEffect(() => { checkIfFavorite(); }, [user, professionalId]);
  useEffect(() => {
    if (professionalId && user) trackProfileView();
  }, [professionalId, user]);

  const trackProfileView = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingMetrics = await base44.entities.ProfileMetrics.filter({ professional_id: professionalId, date: today });
      if (existingMetrics.length > 0) {
        await base44.entities.ProfileMetrics.update(existingMetrics[0].id, { profile_views: (existingMetrics[0].profile_views || 0) + 1 });
      } else {
        await base44.entities.ProfileMetrics.create({ professional_id: professionalId, date: today, profile_views: 1, search_appearances: 0, messages_received: 0, contact_clicks: 0 });
      }
    } catch {}
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch { setUser(null); }
  };

  const checkIfFavorite = async () => {
    if (!user || !professionalId) return;
    try {
      const favorites = await base44.entities.Favorite.filter({ client_id: user.id, professional_id: professionalId });
      setIsFavorite(favorites.length > 0);
    } catch {}
  };

  const handleToggleFavorite = async () => {
    if (!user) { base44.auth.redirectToLogin(); return; }
    try {
      if (isFavorite) {
        const favorites = await base44.entities.Favorite.filter({ client_id: user.id, professional_id: professionalId });
        if (favorites[0]) await base44.entities.Favorite.delete(favorites[0].id);
        setIsFavorite(false);
        toast.success("Eliminado de favoritos");
      } else {
        await base44.entities.Favorite.create({ client_id: user.id, professional_id: professionalId, business_name: profile.business_name });
        setIsFavorite(true);
        toast.success("Añadido a favoritos");
      }
    } catch {}
  };

  const handleStartChat = async () => {
    if (!user) { base44.auth.redirectToLogin(); return; }
    const conversationId = [user.id, professionalId].sort().join('_');
    const existingMessages = await base44.entities.Message.filter({ conversation_id: conversationId });
    if (existingMessages.length === 0) {
      await base44.entities.Message.create({
        conversation_id: conversationId, sender_id: user.id, recipient_id: professionalId,
        content: "Hola, estoy interesado en tus servicios.",
        professional_name: profile.business_name, client_name: user.full_name || user.email, is_read: false
      });
      const today = new Date().toISOString().split('T')[0];
      const metrics = await base44.entities.ProfileMetrics.filter({ professional_id: professionalId, date: today });
      if (metrics.length > 0) await base44.entities.ProfileMetrics.update(metrics[0].id, { messages_received: (metrics[0].messages_received || 0) + 1 });
    }
    navigate(createPageUrl("Messages") + `?conversation=${conversationId}&professional=${professionalId}`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: profile?.business_name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    }
  };

  const trackContactClick = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const metrics = await base44.entities.ProfileMetrics.filter({ professional_id: professionalId, date: today });
      if (metrics.length > 0) await base44.entities.ProfileMetrics.update(metrics[0].id, { contact_clicks: (metrics[0].contact_clicks || 0) + 1 });
    } catch {}
  };

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['professionalProfile', professionalId],
    queryFn: async () => {
      const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: professionalId });
      return profiles[0];
    },
    enabled: !!professionalId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: professionalUser } = useQuery({
    queryKey: ['professionalUser', professionalId],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: professionalId });
      return users[0];
    },
    enabled: !!professionalId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', professionalId],
    queryFn: async () => {
      const allReviews = await base44.entities.Review.filter({ professional_id: professionalId });
      return allReviews.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!professionalId,
    staleTime: 1000 * 60 * 2,
  });

  const { data: metrics } = useQuery({
    queryKey: ['profileMetrics', professionalId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const allMetrics = await base44.entities.ProfileMetrics.filter({ professional_id: professionalId });
      const recentMetrics = allMetrics.filter(m => new Date(m.date) >= thirtyDaysAgo);
      return {
        views: recentMetrics.reduce((sum, m) => sum + (m.profile_views || 0), 0),
        searches: recentMetrics.reduce((sum, m) => sum + (m.search_appearances || 0), 0),
        contacts: recentMetrics.reduce((sum, m) => sum + (m.contact_clicks || 0), 0)
      };
    },
    enabled: !!professionalId && user?.id === professionalId,
    staleTime: 1000 * 60 * 5,
  });

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-14 bg-white border-b border-gray-100" />
        <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Perfil no encontrado</h2>
          <p className="text-gray-500 mb-6">Este perfil no existe o ha sido eliminado.</p>
          <Button onClick={() => navigate(createPageUrl("Search"))} className="bg-blue-600 hover:bg-blue-700">
            ← Volver al buscador
          </Button>
        </div>
      </div>
    );
  }

  const seoTitle = `${profile.business_name} - ${profile.categories?.[0] || 'Profesional'} en ${profile.ciudad || profile.provincia}`;
  const seoDescription = profile.descripcion_corta || `${profile.business_name} ofrece servicios profesionales en ${profile.ciudad || profile.provincia}. Contacta ahora.`;

  const availableContactMethods = profile.metodos_contacto || [];
  const showPhone = availableContactMethods.includes('telefono') && profile.telefono_contacto;
  const showWhatsApp = availableContactMethods.includes('whatsapp') && profile.telefono_contacto;
  const showChat = availableContactMethods.includes('chat_interno');
  const isOwner = user?.id === professionalId;
  const photoUrl = professionalUser?.profile_picture || profile.imagen_principal;
  const firstName = profile.business_name?.split(' ')[0] || profile.business_name;

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={`${profile.categories?.join(', ')}, ${profile.ciudad}, ${profile.provincia}, autónomo`}
        type="profile"
      />
      <LocalBusinessSchema profile={profile} reviews={reviews} professionalUser={professionalUser} />

      <div className="min-h-screen bg-gray-50 pb-24 md:pb-10">

        {/* ── STICKY NAV BAR ── */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <span className="text-sm text-gray-500 flex-1 truncate font-medium">
            {profile.business_name}
          </span>
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <Share2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleToggleFavorite}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* ── HERO ── */}
        <div className="max-w-4xl mx-auto px-4 pt-4">
          {/* Cover */}
          <div className="relative h-28 md:h-36 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 0%, transparent 50%)' }} />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 80%, white 0%, transparent 40%)' }} />
          </div>

          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm -mt-12 mx-2 md:mx-4 p-5 relative">
            {/* Avatar */}
            <div className="absolute -top-10 left-5">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={profile.business_name}
                  className="w-20 h-20 rounded-2xl border-4 border-white object-cover shadow-md cursor-pointer"
                  onClick={() => { setSelectedImage(photoUrl); setSelectedImageIndex(-1); }}
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                  {profile.business_name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="pt-12">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{profile.business_name}</h1>
                  {profile.categories?.[0] && (
                    <p className="text-blue-600 font-medium text-sm mt-0.5">{profile.categories[0]}</p>
                  )}
                  {(profile.ciudad || profile.provincia) && (
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {[profile.ciudad, profile.provincia].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                {profile.average_rating > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 flex items-center gap-1.5 flex-shrink-0">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold text-gray-900">{profile.average_rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({profile.total_reviews})</span>
                  </div>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Perfil verificado
                </span>
                {profile.years_experience > 0 && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    <Award className="w-3 h-3" />
                    {profile.years_experience} {profile.years_experience === 1 ? 'año' : 'años'} de experiencia
                  </span>
                )}
                {profile.tarifa_base > 0 && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    <Euro className="w-3 h-3" /> desde {profile.tarifa_base}€/hora
                  </span>
                )}
              </div>

              {/* Contact buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                {showChat && (
                  <button
                    onClick={() => { trackContactClick(); handleStartChat(); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-md"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat directo
                  </button>
                )}
                {showWhatsApp && (
                  <a
                    href={`https://wa.me/${cleanPhone(profile.telefono_contacto)}?text=${encodeURIComponent('Hola, te contacto desde MisAutónomos')}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={trackContactClick}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-md"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                )}
                {showPhone && (
                  <>
                    <a
                      href={`tel:${cleanPhoneForCall(profile.telefono_contacto)}`}
                      onClick={trackContactClick}
                      className="bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all md:hidden"
                    >
                      <Phone className="w-4 h-4" /> {profile.telefono_contacto}
                    </a>
                    <button
                      onClick={() => { trackContactClick(); setShowPhoneModal(true); }}
                      className="hidden md:flex bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl py-3 px-4 items-center justify-center gap-2 text-gray-800 font-semibold transition-all"
                    >
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="select-all">{profile.telefono_contacto}</span>
                    </button>
                  </>
                )}
              </div>

              {/* Response hint */}
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Responde en menos de 1 hora
              </p>
            </div>
          </div>
        </div>

        {/* ── CONTENT GRID ── */}
        <div className="max-w-4xl mx-auto px-4 mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* ── COLUMNA PRINCIPAL (2/3) ── */}
          <div className="md:col-span-2 space-y-4">

            {/* Sobre mí */}
            {(profile.description || profile.descripcion_corta) && (
              <section className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-3">Sobre mí</h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {profile.description || profile.descripcion_corta}
                </p>
              </section>
            )}

            {/* Galería de trabajos */}
            {profile.photos?.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" /> Trabajos realizados
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {profile.photos.slice(0, 6).map((url, i) => (
                    <div
                      key={i}
                      onClick={() => { setSelectedImage(url); setSelectedImageIndex(i); }}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-gray-100"
                    >
                      <img src={url} alt={`Trabajo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Servicios ofrecidos */}
            {profile.services_offered?.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-3">Servicios que ofrezco</h2>
                <div className="space-y-2">
                  {profile.services_offered.map((s, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{s.name}</h4>
                        {s.description && <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>}
                        {s.duration && <p className="text-xs text-gray-400 mt-0.5">⏱ {s.duration} {s.unit || 'h'}</p>}
                      </div>
                      {s.price && <span className="text-blue-600 font-bold text-sm whitespace-nowrap">{s.price}€</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Redes sociales */}
            {(profile.website || profile.social_links?.facebook || profile.social_links?.instagram || profile.social_links?.linkedin || profile.social_links?.tiktok) && (
              <section className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-3">Redes sociales</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors">
                      <Globe className="w-4 h-4" /> Web
                    </a>
                  )}
                  {profile.social_links?.instagram && (
                    <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1.5 bg-pink-50 border border-pink-100 hover:border-pink-300 rounded-xl px-3 py-2 text-sm font-medium text-pink-700 transition-colors">
                      <Instagram className="w-4 h-4" /> Instagram
                    </a>
                  )}
                  {profile.social_links?.facebook && (
                    <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 hover:border-blue-300 rounded-xl px-3 py-2 text-sm font-medium text-blue-700 transition-colors">
                      <Facebook className="w-4 h-4" /> Facebook
                    </a>
                  )}
                  {profile.social_links?.linkedin && (
                    <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 hover:border-blue-300 rounded-xl px-3 py-2 text-sm font-medium text-blue-800 transition-colors">
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                  )}
                  {profile.social_links?.tiktok && (
                    <a href={profile.social_links.tiktok} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors">
                      <Music className="w-4 h-4" /> TikTok
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Estadísticas (solo propietario) */}
            {isOwner && metrics && (
              <section className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-3">📊 Estadísticas últimos 30 días</h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: metrics.views, label: 'Visitas' },
                    { value: metrics.searches, label: 'Búsquedas' },
                    { value: metrics.contacts, label: 'Contactos' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 bg-white rounded-xl shadow-sm">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Opiniones */}
            <section className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> Opiniones de clientes
                {reviews.length > 0 && <span className="text-sm font-normal text-gray-500">({reviews.length})</span>}
              </h2>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Todavía sin opiniones</p>
              ) : (
                <div className="space-y-3">
                  {reviews.slice(0, 5).map(r => <ReviewCard key={r.id} review={r} />)}
                </div>
              )}
              <ReviewSection professionalId={professionalId} reviews={reviews} currentUser={user} />
            </section>
          </div>

          {/* ── COLUMNA LATERAL (1/3) ── */}
          <div className="space-y-4">

            {/* Disponibilidad */}
            {(profile.horario_apertura || profile.disponibilidad_tipo) && (
              <section className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-600" /> Disponibilidad
                </h3>
                {profile.disponibilidad_tipo && (
                  <p className="text-sm text-gray-700 mb-1">
                    {profile.disponibilidad_tipo === 'laborables' ? 'Días laborables' :
                     profile.disponibilidad_tipo === 'festivos' ? 'Fines de semana y festivos' :
                     'Todos los días'}
                  </p>
                )}
                {profile.horario_apertura && profile.horario_cierre && (
                  <p className="text-sm text-gray-500">{profile.horario_apertura} – {profile.horario_cierre}</p>
                )}
              </section>
            )}

            {/* Zona de servicio */}
            {(profile.ciudad || profile.provincia || profile.radio_servicio_km) && (
              <section className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-blue-600" /> Zona de trabajo
                </h3>
                <p className="text-sm text-gray-700">{[profile.ciudad, profile.provincia].filter(Boolean).join(', ')}</p>
                {profile.radio_servicio_km > 0 && (
                  <p className="text-xs text-gray-400 mt-1">Radio: {profile.radio_servicio_km} km</p>
                )}
                {profile.service_area && (
                  <p className="text-xs text-gray-500 mt-1">{profile.service_area}</p>
                )}
              </section>
            )}

            {/* Especialidades */}
            {profile.skills?.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Especialidades</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s, i) => (
                    <span key={i} className="bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Certificaciones */}
            {profile.certifications?.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-amber-500" /> Certificaciones y títulos
                </h3>
                <ul className="space-y-2">
                  {profile.certifications.map((c, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Formas de pago */}
            {profile.formas_pago?.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Formas de pago</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.formas_pago.map((p, i) => (
                    <span key={i} className="bg-gray-50 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200">{p}</span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* ── CTA STICKY MÓVIL (solo si no es propietario) ── */}
      {!isOwner && showChat && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-3 md:hidden z-30 shadow-lg">
          <button
            onClick={() => { trackContactClick(); handleStartChat(); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-5 h-5" /> Contactar con {firstName}
          </button>
        </div>
      )}

      {/* ── MODAL TELÉFONO DESKTOP ── */}
      <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Número de teléfono</DialogTitle>
            <DialogDescription>Llama desde tu teléfono a este número</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 w-full text-center">
              <p className="text-3xl font-bold text-blue-700 tracking-wide">{profile.telefono_contacto}</p>
            </div>
            <Button
              onClick={() => { navigator.clipboard.writeText(profile.telefono_contacto); setCopiedPhone(true); toast.success("Número copiado"); setTimeout(() => setCopiedPhone(false), 2000); }}
              variant="outline" className="w-full"
            >
              {copiedPhone ? <><Check className="w-4 h-4 mr-2 text-green-600" /> Copiado</> : <><Copy className="w-4 h-4 mr-2" /> Copiar número</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── LIGHTBOX GALERÍA ── */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
            <X className="w-6 h-6 text-white" />
          </button>
          {selectedImageIndex >= 0 && profile.photos?.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); const ni = selectedImageIndex === 0 ? profile.photos.length - 1 : selectedImageIndex - 1; setSelectedImageIndex(ni); setSelectedImage(profile.photos[ni]); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); const ni = selectedImageIndex === profile.photos.length - 1 ? 0 : selectedImageIndex + 1; setSelectedImageIndex(ni); setSelectedImage(profile.photos[ni]); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1.5 rounded-full">
                <span className="text-white text-sm">{selectedImageIndex + 1} / {profile.photos.length}</span>
              </div>
            </>
          )}
          <img src={selectedImage} alt="Vista ampliada" className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}