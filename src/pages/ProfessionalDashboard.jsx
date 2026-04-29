import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  MessageSquare, Users, FileText, Eye, CreditCard,
  ArrowRight, Plus, CheckCircle2, AlertCircle, Clock,
  ExternalLink, Sparkles, TrendingUp, Circle, Star, Gift, Megaphone
} from "lucide-react";
import SEOHead from "../components/seo/SEOHead";
import PullToRefresh from "../components/ui/PullToRefresh";
import { getEffectivePlan, isAdsPlus } from "@/utils/subscription";

function computeProfilePct(profile) {
  if (!profile) return 0;
  const checks = [
    !!(profile.business_name && profile.descripcion_corta),
    !!profile.imagen_principal,
    Array.isArray(profile.categories) && profile.categories.length > 0,
    !!(profile.provincia && profile.ciudad),
    !!(profile.description && profile.description.length > 80),
    Array.isArray(profile.photos) && profile.photos.length >= 3,
    Array.isArray(profile.services_offered) && profile.services_offered.length > 0,
    Array.isArray(profile.metodos_contacto) && profile.metodos_contacto.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function computeMissingFields(profile) {
  if (!profile) return [];
  const items = [
    { key: "basic", label: "Nombre y descripción corta", done: !!(profile.business_name && profile.descripcion_corta) },
    { key: "photo", label: "Foto de perfil", done: !!profile.imagen_principal },
    { key: "categories", label: "Categorías de servicio", done: Array.isArray(profile.categories) && profile.categories.length > 0 },
    { key: "location", label: "Provincia y ciudad", done: !!(profile.provincia && profile.ciudad) },
    { key: "description", label: "Descripción detallada", done: !!(profile.description && profile.description.length > 80) },
    { key: "gallery", label: "Al menos 3 fotos de trabajos", done: Array.isArray(profile.photos) && profile.photos.length >= 3 },
    { key: "services", label: "Servicios ofrecidos", done: Array.isArray(profile.services_offered) && profile.services_offered.length > 0 },
    { key: "contact", label: "Métodos de contacto", done: Array.isArray(profile.metodos_contacto) && profile.metodos_contacto.length > 0 },
  ];
  return items.filter(i => !i.done).slice(0, 3);
}

export default function ProfessionalDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      // Reutilizar cache del layout para evitar doble fetch
      const cached = sessionStorage.getItem('current_user');
      if (cached) {
        const { user: cachedUser, timestamp } = JSON.parse(cached);
        if (cachedUser && Date.now() - timestamp < 300000) {
          if (cachedUser.user_type !== 'professionnel') { navigate(createPageUrl("Search")); return; }
          setUser(cachedUser);
          setLoading(false);
          return;
        }
      }
      const u = await base44.auth.me();
      if (!u || u.user_type !== 'professionnel') { navigate(createPageUrl("Search")); return; }
      setUser(u);
    } catch {
      navigate(createPageUrl("Search"));
    } finally {
      setLoading(false);
    }
  };

  const { data: messages = [] } = useQuery({
    queryKey: ['unreadMessages', user?.id],
    queryFn: () => base44.entities.Message.filter({ recipient_id: user.id, is_read: false }),
    enabled: !!user,
    staleTime: 60000,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['clientContacts', user?.id],
    queryFn: () => base44.entities.ClientContact.filter({ professional_id: user.id }),
    enabled: !!user,
    staleTime: 60000 * 5,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: () => base44.entities.Invoice.filter({ professional_id: user.id }),
    enabled: !!user,
    staleTime: 60000 * 5,
  });

  const { data: profile } = useQuery({
    queryKey: ['professionalProfile', user?.id],
    queryFn: async () => {
      const p = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });
      return p[0] || null;
    },
    enabled: !!user,
    staleTime: 60000 * 5,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const s = await base44.entities.Subscription.filter({ user_id: user.id });
      return s[0] || null;
    },
    enabled: !!user,
    staleTime: 60000 * 2,
  });

  const { data: effectivePlan } = useQuery({
    queryKey: ['effectivePlan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await getEffectivePlan(user.id);
    },
    enabled: !!user,
    staleTime: 60000 * 2,
  });

  // Cargar briefing actual si tiene Plan Ads+ (efectivo)
  const { data: currentBriefing } = useQuery({
    queryKey: ['adsBriefing_dashboard', user?.id],
    queryFn: async () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const briefings = await base44.entities.AdsBriefing.filter({
        professional_id: user.id,
        month_year: `${year}-${String(month).padStart(2, '0')}`
      }).limit(1);
      return briefings[0] || null;
    },
    enabled: !!user && isAdsPlus(effectivePlan),
    staleTime: 60000 * 5,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['myReviews', user?.id],
    queryFn: () => base44.entities.Review.filter({ professional_id: user.id }),
    enabled: !!user,
    staleTime: 60000 * 2,
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['profileMetrics', user?.id],
    queryFn: async () => {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const all = await base44.entities.ProfileMetrics.filter({ professional_id: user.id });
      return all.filter(m => m.professional_id && m.professional_id !== 'system' && m.date >= firstOfMonth);
    },
    enabled: !!user,
    staleTime: 60000 * 5,
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['unreadMessages'] });
    await queryClient.invalidateQueries({ queryKey: ['clientContacts'] });
    await queryClient.invalidateQueries({ queryKey: ['invoices'] });
    await queryClient.invalidateQueries({ queryKey: ['profileMetrics'] });
    await queryClient.invalidateQueries({ queryKey: ['subscription'] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const unreadCount = messages.length;
  const monthViews = metrics.reduce((s, m) => s + (m.profile_views || 0), 0);
  const clientCount = contacts.length;
  const pendingInvoices = invoices.filter(i => i.status === 'sent').length;
  const profilePct = computeProfilePct(profile);
  const missingFields = computeMissingFields(profile);

  // Suscripción
  const hasActiveSub = subscription && (subscription.estado === 'activo' || subscription.estado === 'en_prueba');
  const daysLeft = subscription?.fecha_expiracion
    ? Math.ceil((new Date(subscription.fecha_expiracion) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;
  const subExpiring = hasActiveSub && daysLeft <= 7;

  const hour = new Date().getHours();
  const greeting = hour < 13 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  const displayName = profile?.business_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || "Pro";

  const statCards = [
    {
      label: "Mensajes sin leer",
      value: unreadCount,
      icon: MessageSquare,
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
      textColor: "text-blue-700",
      alert: unreadCount > 0,
      action: () => navigate(createPageUrl("Messages")),
      cta: unreadCount > 0 ? "Ver mensajes" : null,
    },
    {
      label: "Vistas este mes",
      value: monthViews,
      icon: Eye,
      color: "from-violet-500 to-purple-500",
      bg: "bg-violet-50",
      textColor: "text-violet-700",
      action: () => navigate("/visibilidad"),
      cta: null,
    },
    {
      label: "Clientes guardados",
      value: clientCount,
      icon: Users,
      color: "from-emerald-500 to-green-500",
      bg: "bg-emerald-50",
      textColor: "text-emerald-700",
      action: () => navigate(createPageUrl("CRM")),
      cta: null,
    },
    {
      label: "Facturas pendientes",
      value: pendingInvoices,
      icon: FileText,
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      textColor: "text-amber-700",
      alert: pendingInvoices > 0,
      action: () => navigate(createPageUrl("Invoices")),
      cta: pendingInvoices > 0 ? "Ver facturas" : null,
    },
  ];

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <SEOHead title="Inicio — MisAutónomos" noindex />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* HEADER */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <p className="text-sm text-gray-500">{greeting}, {displayName} 👋</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-0.5">Tu panel</h1>
          </motion.div>

          {/* BANNER REGALO ACTIVO */}
          {subscription?.gifted_plan_id && subscription?.gifted_until && new Date(subscription.gifted_until) > new Date() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-2xl p-4 md:p-5"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🎁</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">Tienes {subscription.gifted_plan_name} cortesía de MisAutónomos</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Activo hasta el <strong>{new Date(subscription.gifted_until).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* BANNER FOTO PRINCIPAL FALTANTE */}
          {hasActiveSub && profile && !profile.imagen_principal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 md:p-5"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">📸</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">Tu perfil necesita una foto principal</p>
                  <p className="text-xs text-gray-600 mt-0.5">Los perfiles con foto reciben <strong>3× más contactos</strong>. Sin foto tu perfil pierde visibilidad.</p>
                </div>
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold flex-shrink-0 text-xs"
                  onClick={() => navigate(createPageUrl("MyProfile") + "?section=photo")}
                >
                  Añadir foto
                </Button>
              </div>
            </motion.div>
          )}

          {/* ALERTA SUSCRIPCIÓN */}
          {!hasActiveSub && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 md:p-5 text-white shadow-md"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-base">Tu perfil no es visible</p>
                  <p className="text-sm text-amber-100 mt-0.5">Activa tu plan para aparecer en búsquedas y recibir clientes.</p>
                </div>
                <Button
                  size="sm"
                  className="bg-white text-amber-700 hover:bg-amber-50 font-semibold flex-shrink-0"
                  onClick={() => navigate(createPageUrl("PricingPlans"))}
                >
                  Ver planes
                </Button>
              </div>
            </motion.div>
          )}

          {hasActiveSub && subExpiring && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3"
            >
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">Tu plan expira en {daysLeft} {daysLeft === 1 ? "día" : "días"}</p>
                <p className="text-xs text-amber-700">Renueva para no perder visibilidad</p>
              </div>
              <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100"
                onClick={() => navigate(createPageUrl("SubscriptionManagement"))}>
                Gestionar
              </Button>
            </motion.div>
          )}

          {/* STATS GRID */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                whileTap={{ scale: 0.97 }}
              >
                <Card
                  className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl bg-white group"
                  onClick={card.action}
                >
                  <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${card.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <CardContent className="relative p-4 md:p-5">
                    <div className={`inline-flex w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} items-center justify-center mb-3 shadow-sm`}>
                      <card.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-3xl font-extrabold text-gray-900">{card.value}</p>
                      {card.alert && card.value > 0 && (
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-600 mt-0.5 leading-tight">{card.label}</p>
                    {card.cta && (
                      <p className={`text-xs font-semibold mt-1.5 ${card.textColor} flex items-center gap-0.5`}>
                        {card.cta} <ArrowRight className="w-3 h-3" />
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* COMPLETITUD DEL PERFIL */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                        {profilePct === 100 ? "¡Perfil completo!" : "Completitud del perfil"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {profilePct === 100
                        ? "Tu perfil está optimizado"
                        : "Un perfil completo recibe 5× más contactos"}
                    </p>
                  </div>
                  <span className="text-3xl font-extrabold text-gray-900">{profilePct}<span className="text-base text-gray-400">%</span></span>
                </div>

                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${profilePct}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>

                {profilePct < 100 && missingFields.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    {missingFields.map(f => (
                      <div key={f.key} className="flex items-center gap-2 text-sm text-gray-600">
                        <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <span>{f.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => navigate(createPageUrl("MyProfile"))}
                  className="w-full h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-95 text-white font-semibold rounded-xl"
                >
                  {profilePct === 100 ? "Editar mi perfil" : "Completar perfil"}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* ACCIONES RÁPIDAS */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Acciones rápidas</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Ver mi perfil",
                  icon: ExternalLink,
                  color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
                  action: () => {
                    const slug = profile?.slug_publico || user?.id;
                    window.open(`/autonomo/${slug}`, '_blank');
                  },
                },
                {
                  label: "Nueva factura",
                  icon: Plus,
                  color: "bg-amber-50 text-amber-700 hover:bg-amber-100",
                  action: () => navigate(createPageUrl("Invoices") + "?new=true"),
                },
                {
                  label: "Ver mensajes",
                  icon: MessageSquare,
                  color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                  action: () => navigate(createPageUrl("Messages")),
                  badge: unreadCount > 0 ? unreadCount : null,
                },
              ].map((a, i) => (
                <button
                  key={i}
                  onClick={a.action}
                  className={`relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl font-semibold text-xs transition-colors ${a.color}`}
                >
                  {a.badge && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {a.badge}
                    </span>
                  )}
                  <a.icon className="w-5 h-5" />
                  <span className="text-center leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* RESEÑAS PENDIENTES DE RESPONDER */}
          {reviews.filter(r => !r.professional_response && !r.is_reported).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Reseñas sin responder</h2>
              <div className="space-y-3">
                {reviews.filter(r => !r.professional_response && !r.is_reported).slice(0, 3).map((review) => (
                  <Card key={review.id} className="border-0 shadow-sm rounded-2xl bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-sm truncate">{review.client_name}</span>
                            <div className="flex gap-0.5 flex-shrink-0">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-xs text-gray-600 line-clamp-2">{review.comment}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-shrink-0 text-xs h-8 border-amber-300 text-amber-700 hover:bg-amber-50"
                          onClick={() => navigate(`/autonomo/${user.id}#reviews`)}
                        >
                          Responder
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {reviews.filter(r => !r.professional_response && !r.is_reported).length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{reviews.filter(r => !r.professional_response && !r.is_reported).length - 3} más pendientes
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* WIDGET PLAN ADS+ */}
          {isAdsPlus(effectivePlan) && currentBriefing && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone className="w-5 h-5" />
                    <h3 className="font-semibold text-sm">Tu campaña de {new Date().toLocaleDateString('es-ES', { month: 'long' })}</h3>
                  </div>
                  {currentBriefing.campaign_status === 'live' ? (
                    <>
                      <p className="text-2xl font-bold mt-1">{currentBriefing.campaign_metrics?.leads_generated || 0} leads</p>
                      <p className="text-xs text-blue-200 mt-0.5">
                        {currentBriefing.campaign_metrics?.reach?.toLocaleString() || '0'} personas alcanzadas esta semana
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-blue-100">
                      {currentBriefing.campaign_status === 'pending' ? 'Pendiente de configuración' :
                       currentBriefing.campaign_status === 'in_review' ? 'En revisión' :
                       currentBriefing.campaign_status === 'finished' ? 'Finalizada' : 'En preparación'}
                    </p>
                  )}
                  <Link to="/mi-campana" className="inline-block mt-3 bg-white/10 hover:bg-white/20 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors">
                    Ver detalles →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* WIDGET REFERIDOS */}
          {hasActiveSub && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: subscription?.plan_id === 'plan_adsplus' ? 0.42 : 0.38 }}>
              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 rounded-2xl border border-amber-100 p-5 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Gift className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Invita a un colega → gana 1 mes gratis</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Llevas <strong>{profile?.referral_count || 0} referidos</strong> y has ganado <strong>{profile?.referral_months_earned || 0} meses</strong> gratis. ¡Sin límite!
                  </p>
                  <button
                    onClick={() => navigate("/referidos")}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Gift className="w-3.5 h-3.5" /> Ir a mis referidos
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ESTADO SUSCRIPCIÓN */}
          {hasActiveSub && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <Card className="border-0 shadow-sm rounded-2xl bg-white cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(createPageUrl("SubscriptionManagement"))}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${subscription.estado === 'en_prueba' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    <CreditCard className={`w-5 h-5 ${subscription.estado === 'en_prueba' ? 'text-blue-600' : 'text-green-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{subscription.plan_nombre}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {subscription.estado === 'en_prueba'
                        ? `Prueba gratuita · ${daysLeft} días restantes`
                        : `Activo · Renueva en ${daysLeft} días`}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          )}

        </div>
      </div>
    </PullToRefresh>
  );
}