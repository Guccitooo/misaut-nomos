import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye, MessageSquare, FileText, Star, ArrowUp, ArrowDown,
  AlertCircle, Clock, CheckCircle2, TrendingUp, User, Zap,
  ChevronRight, CreditCard, ArrowRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import SEOHead from "../components/seo/SEOHead";
import PullToRefresh from "../components/ui/PullToRefresh";

// ── Completitud de perfil ──────────────────────────────────────────────────
const PROFILE_FIELDS = [
  { key: "imagen_principal", label: "Foto de perfil", weight: 15 },
  { key: "descripcion_corta", label: "Descripción corta", weight: 10 },
  { key: "description", label: "Descripción completa", weight: 10 },
  { key: "categories", label: "Categorías", weight: 10, check: v => v && v.length > 0 },
  { key: "provincia", label: "Ubicación", weight: 10 },
  { key: "telefono_contacto", label: "Teléfono", weight: 10 },
  { key: "photos", label: "Fotos de trabajos (mín. 3)", weight: 15, check: v => v && v.length >= 3 },
  { key: "services_offered", label: "Servicios ofrecidos", weight: 10, check: v => v && v.length > 0 },
  { key: "years_experience", label: "Años de experiencia", weight: 10, check: v => v > 0 },
];

function computeCompleteness(profile) {
  if (!profile) return { pct: 0, missing: [] };
  const missing = [];
  const pct = PROFILE_FIELDS.reduce((total, f) => {
    const value = profile[f.key];
    const done = f.check ? f.check(value) : !!value;
    if (!done) missing.push(f.label);
    return total + (done ? f.weight : 0);
  }, 0);
  return { pct, missing };
}

// ── Componentes auxiliares ─────────────────────────────────────────────────
function MetricCard({ icon: Icon, iconColor, label, value, sub, badge, loading }) {
  if (loading) return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-4 w-24" />
    </Card>
  );
  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {badge}
        </div>
        <div className="text-3xl font-extrabold text-gray-900 mb-1">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function ProgressBar({ pct }) {
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const STATUS_BADGE = {
  pending: <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pendiente</Badge>,
  accepted: <Badge className="bg-green-100 text-green-700 border-green-200">Aceptado</Badge>,
  rejected: <Badge className="bg-red-100 text-red-700 border-red-200">Rechazado</Badge>,
  completed: <Badge className="bg-blue-100 text-blue-700 border-blue-200">Completado</Badge>,
};

// ── Página principal ───────────────────────────────────────────────────────
export default function ProfessionalDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);

  const loadAll = async (skipCache = false) => {
    try {
      // Usuario
      let currentUser = null;
      const cached = sessionStorage.getItem("current_user");
      if (cached && !skipCache) {
        try {
          const { user: cu, timestamp } = JSON.parse(cached);
          if (cu && Date.now() - timestamp < 300000) currentUser = cu;
        } catch {}
      }
      if (!currentUser) currentUser = await base44.auth.me();
      if (!currentUser || currentUser.user_type !== "professionnel") {
        navigate(createPageUrl("Search")); return;
      }
      setUser(currentUser);

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const [profile, allMetrics, allMessages, quoteRequests, reviews, subscriptions] = await Promise.all([
        base44.entities.ProfessionalProfile.filter({ user_id: currentUser.id }).then(r => r[0] || null),
        base44.entities.ProfileMetrics.filter({ professional_id: currentUser.id }),
        base44.entities.Message.filter({ recipient_id: currentUser.id }),
        base44.entities.QuoteRequest.filter({ professional_id: currentUser.id }).catch(() => []),
        base44.entities.Review.filter({ professional_id: currentUser.id }),
        base44.entities.Subscription.filter({ user_id: currentUser.id }),
      ]);

      // Métricas de visitas
      const thisMonthMetrics = allMetrics.filter(m => m.date >= thisMonthStart);
      const lastMonthMetrics = allMetrics.filter(m => m.date >= lastMonthStart && m.date < thisMonthStart);
      const thisMonthViews = thisMonthMetrics.reduce((s, m) => s + (m.profile_views || 0), 0);
      const lastMonthViews = lastMonthMetrics.reduce((s, m) => s + (m.profile_views || 0), 0);
      const viewsChange = lastMonthViews > 0 ? Math.round((thisMonthViews - lastMonthViews) / lastMonthViews * 100) : null;

      // Mensajes este mes
      const messagesThisMonth = allMessages.filter(m => m.created_date >= thisMonthStart + "T00:00:00");
      const unreadMessages = allMessages.filter(m => !m.is_read);
      const recentMessages = [...allMessages].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

      // Presupuestos
      const quotesAccepted = quoteRequests.filter(q => q.status === "accepted").length;
      const recentQuotes = [...quoteRequests].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

      // Reseñas
      const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : null;

      // Suscripción
      const subscription = subscriptions[0] || null;

      // Gráfico 30 días
      const dailyViews = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const dateStr = d.toISOString().split("T")[0];
        const dayMetrics = allMetrics.filter(m => m.date === dateStr);
        return {
          date: d.getDate() + "/" + (d.getMonth() + 1),
          visitas: dayMetrics.reduce((s, m) => s + (m.profile_views || 0), 0),
        };
      });

      // Completitud
      const { pct: completeness, missing: missingFields } = computeCompleteness(profile);

      // Tips
      const tips = [];
      if (!profile?.imagen_principal) tips.push("📸 Añade una foto de perfil — los perfiles con foto reciben 3× más contactos");
      if (!profile?.photos || profile.photos.length < 3) tips.push("🖼️ Sube al menos 3 fotos de tus trabajos para ganar credibilidad");
      if (!profile?.descripcion_corta || profile.descripcion_corta.length < 100) tips.push("✍️ Amplía tu descripción para explicar mejor lo que ofreces");
      if (reviews.length === 0) tips.push("⭐ Pide a tus clientes satisfechos que te dejen una reseña");
      if (!profile?.metodos_contacto?.includes("whatsapp")) tips.push("💬 Activa WhatsApp para que te contacten directamente");
      tips.push("⚡ Responde en menos de 1 hora — los clientes eligen al primero que contesta");

      setData({
        profile, subscription,
        thisMonthViews, viewsChange,
        messagesThisMonth: messagesThisMonth.length,
        unreadMessages: unreadMessages.length,
        recentMessages,
        quoteRequests, quotesAccepted, recentQuotes,
        reviews, avgRating,
        dailyViews, completeness, missingFields,
        tips: tips.slice(0, 3),
      });
    } catch (err) {
      console.error(err);
      navigate(createPageUrl("Search"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await loadAll(true);
  };

  if (loading || !user || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <Skeleton className="h-40 rounded-2xl" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const { profile, subscription, thisMonthViews, viewsChange, messagesThisMonth, unreadMessages,
    recentMessages, quoteRequests, quotesAccepted, recentQuotes, reviews, avgRating,
    dailyViews, completeness, missingFields, tips } = data;

  const displayName = profile?.business_name?.split(" ")[0] || user.full_name?.split(" ")[0] || "Pro";

  const daysLeft = subscription?.fecha_expiracion
    ? Math.ceil((new Date(subscription.fecha_expiracion) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;
  const hasActiveSub = subscription && (subscription.estado === "activo" || subscription.estado === "en_prueba") && daysLeft > 0;

  const barColor = completeness >= 80 ? "#22c55e" : completeness >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <SEOHead title="Inicio — MisAutónomos" noindex />
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* ── 1. HEADER ── */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              ¡Hola, {displayName}! 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">Este es el resumen de tu actividad en MisAutónomos</p>
          </div>

          {/* Alerta suscripción */}
          {!hasActiveSub && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white flex items-center gap-3">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-sm">Tu perfil no es visible</p>
                <p className="text-xs text-amber-100">Activa tu plan para aparecer en búsquedas</p>
              </div>
              <Button size="sm" className="bg-white text-amber-700 hover:bg-amber-50 font-semibold flex-shrink-0"
                onClick={() => navigate(createPageUrl("PricingPlans"))}>
                Ver planes
              </Button>
            </div>
          )}

          {hasActiveSub && daysLeft <= 7 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">Tu plan expira en {daysLeft} {daysLeft === 1 ? "día" : "días"}</p>
                <p className="text-xs text-amber-700">Renueva para no perder visibilidad</p>
              </div>
              <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100"
                onClick={() => navigate(createPageUrl("SubscriptionManagement"))}>
                Gestionar
              </Button>
            </div>
          )}

          {/* ── 2. GRID MÉTRICAS ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {/* Visitas */}
            <MetricCard
              icon={Eye} iconColor="bg-blue-600"
              label="Visitas este mes"
              value={thisMonthViews}
              sub={viewsChange !== null ? (
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${viewsChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {viewsChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(viewsChange)}% vs mes anterior
                </span>
              ) : <span className="text-xs text-gray-400">Sin datos anteriores</span>}
            />

            {/* Mensajes */}
            <MetricCard
              icon={MessageSquare} iconColor="bg-emerald-500"
              label="Mensajes este mes"
              value={messagesThisMonth}
              badge={unreadMessages > 0 ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {unreadMessages}
                </span>
              ) : null}
              sub={unreadMessages > 0
                ? <span className="text-xs text-red-500 font-medium cursor-pointer hover:underline" onClick={() => navigate(createPageUrl("Messages"))}>{unreadMessages} sin leer →</span>
                : <span className="text-xs text-gray-400">Al día</span>}
            />

            {/* Presupuestos */}
            <MetricCard
              icon={FileText} iconColor="bg-violet-500"
              label="Presupuestos"
              value={quoteRequests.length}
              sub={<span className="text-xs text-gray-500">{quotesAccepted} aceptados</span>}
            />

            {/* Valoración */}
            <MetricCard
              icon={Star} iconColor="bg-amber-400"
              label="Valoración media"
              value={avgRating || "—"}
              sub={reviews.length > 0
                ? <span className="text-xs text-gray-500">{reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}</span>
                : <span className="text-xs text-gray-400">Sin reseñas aún</span>}
              badge={avgRating ? (
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-3 h-3 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                  ))}
                </div>
              ) : null}
            />
          </div>

          {/* ── 3. COMPLETITUD DEL PERFIL ── */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <CardContent className="p-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-bold text-gray-900">Estado de tu perfil</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {completeness === 100 ? "¡Tu perfil está completo y optimizado!" : "Un perfil completo recibe 5× más contactos"}
                  </p>
                </div>
                <span className="text-3xl font-extrabold" style={{ color: barColor }}>{completeness}%</span>
              </div>
              <ProgressBar pct={completeness} />
              {missingFields.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {missingFields.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                  <div className="mt-3">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                      onClick={() => navigate(createPageUrl("MyProfile"))}>
                      Completar mi perfil <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 4. ACTIVIDAD RECIENTE ── */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Últimos mensajes */}
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Últimos mensajes</h2>
                  <Button variant="ghost" size="sm" className="text-blue-600 text-xs"
                    onClick={() => navigate(createPageUrl("Messages"))}>
                    Ver todos →
                  </Button>
                </div>
                {recentMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aún no tienes mensajes</p>
                    <p className="text-xs mt-1">Comparte tu perfil para empezar a recibir contactos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMessages.map(msg => {
                      const convId = msg.conversation_id;
                      const senderName = msg.client_name || msg.sender_id?.slice(0, 8) || "Cliente";
                      return (
                        <div
                          key={msg.id}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => navigate(createPageUrl("Messages") + `?conversation=${convId}`)}
                        >
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-sm">
                            {senderName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-900 truncate">{senderName}</p>
                              {!msg.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-1" />}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{msg.content}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {formatDistanceToNow(new Date(msg.created_date), { locale: es, addSuffix: true })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Últimas solicitudes de presupuesto */}
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Solicitudes de presupuesto</h2>
                  <Button variant="ghost" size="sm" className="text-blue-600 text-xs"
                    onClick={() => navigate(createPageUrl("QuoteRequests"))}>
                    Ver todas →
                  </Button>
                </div>
                {recentQuotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sin solicitudes todavía</p>
                    <p className="text-xs mt-1">Las solicitudes de tus clientes aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentQuotes.map(q => (
                      <div key={q.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(createPageUrl("QuoteRequests"))}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{q.title || "Solicitud de presupuesto"}</p>
                          <p className="text-xs text-gray-500">{q.client_name || "Cliente"}</p>
                        </div>
                        {STATUS_BADGE[q.status] || STATUS_BADGE.pending}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── 5. CONSEJOS ── */}
          {tips.length > 0 && (
            <Card className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <h2 className="font-bold text-blue-900">Consejos para destacar</h2>
                </div>
                <div className="space-y-2">
                  {tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-blue-800">
                      <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 6. SUSCRIPCIÓN ── */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(createPageUrl("SubscriptionManagement"))}>
            <CardContent className="p-0 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${hasActiveSub ? "bg-green-100" : "bg-red-100"}`}>
                <CreditCard className={`w-5 h-5 ${hasActiveSub ? "text-green-600" : "text-red-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 text-sm">{subscription?.plan_nombre || "Sin plan activo"}</p>
                  {subscription && (
                    <Badge className={
                      subscription.estado === "en_prueba" ? "bg-blue-100 text-blue-700" :
                      subscription.estado === "activo" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    }>
                      {subscription.estado === "en_prueba" ? "Prueba gratuita" :
                       subscription.estado === "activo" ? "Activo" : "Expirado"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {hasActiveSub
                    ? (subscription.estado === "en_prueba"
                      ? `${daysLeft} días de prueba restantes`
                      : `Renueva en ${daysLeft} días`)
                    : "Reactiva tu plan para aparecer en búsquedas"}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </CardContent>
          </Card>

          {/* ── 7. GRÁFICO VISITAS ── */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-gray-900">Visitas a tu perfil — últimos 30 días</h2>
              </div>
              {dailyViews.every(d => d.visitas === 0) ? (
                <div className="text-center py-10 text-gray-400">
                  <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Aún no hay visitas registradas</p>
                  <p className="text-xs mt-1">Las visitas aparecerán aquí cuando los clientes vean tu perfil</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyViews} barCategoryGap="30%">
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: 13 }}
                      cursor={{ fill: "#eff6ff" }}
                    />
                    <Bar dataKey="visitas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </PullToRefresh>
  );
}