import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, XCircle, Loader2, Shield, Star, Briefcase,
  TrendingUp, ChevronDown, ChevronUp, Zap, Rocket, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";
import SubscriptionProductSchema from "../components/seo/SubscriptionProductSchema";

const PLAN_VISIBILITY_INCLUDES = [
  "Perfil visible en búsquedas de toda España",
  "Foto, descripción y servicios completos",
  "Contacto directo: WhatsApp, llamada y chat",
  "Mensajes ilimitados con clientes",
  "Estadísticas de visitas a tu perfil",
  "Zona de cobertura geográfica",
  "Valoraciones y reseñas",
];

const PLAN_VISIBILITY_EXCLUDES = [
  "Campañas en redes sociales",
  "Posicionamiento destacado",
  "Soporte prioritario",
];

const PLAN_ADSPLUS_INCLUDES = [
  "Todo lo del Plan Visibilidad ✓",
  "30€/mes de presupuesto publicitario REAL invertido en tu campaña",
  "Briefing mensual guiado (eliges red y objetivo cada mes)",
  "Campaña en Instagram, Facebook, TikTok, LinkedIn o Google",
  "Creatividades profesionales hechas por nosotros",
  "Copy publicitario optimizado",
  "Gestión y optimización activa durante todo el mes",
  "Reporte semanal de resultados con métricas reales",
  "Deadline flexible para briefing (día 5 de cada mes)",
];

const FAQS = [
  {
    q: "¿Cuándo se me cobra?",
    a: "Tras los 7 días gratis se hace el primer cobro. Si cancelas antes, no se cobra nada.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí, sin permanencia. Cancela desde tu panel en un clic.",
  },
  {
    q: "¿Hay comisiones por cliente conseguido?",
    a: "No. El precio del plan es lo único que pagas. Lo que ganes con tus clientes es 100% tuyo.",
  },
  {
    q: "¿Qué pasa cuando expira mi plan?",
    a: "Tu perfil deja de aparecer en búsquedas pero tus datos se conservan. Puedes reactivar cuando quieras.",
  },
];

// Detectar si la app corre dentro de un webview nativo de iOS (App Store)
const isNativeIOSApp = () => {
  const ua = navigator.userAgent || "";
  // Base44 wrapper sets a custom UA or the app runs standalone
  const isStandalone = window.navigator.standalone === true;
  const isInWebview = /(iPhone|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);
  return isStandalone || isInWebview;
};

export default function PricingPlansPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNative = isNativeIOSApp();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [billing, setBilling] = useState("monthly"); // "monthly" | "annual"

  const canceled = searchParams.get("canceled");

  const plans = [
    { plan_id: "plan_visibility", nombre: "Plan Visibilidad", precio: 13, duracion_dias: 30 },
    { plan_id: "plan_adsplus", nombre: "Plan Ads+", precio: 33, duracion_dias: 30 },
  ];

  const { data: currentSubscription } = useQuery({
    queryKey: ["currentSubscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      if (!subs.length) return null;
      const sub = subs[0];
      const isActive =
        (sub.estado === "activo" || sub.estado === "en_prueba") &&
        new Date(sub.fecha_expiracion) >= new Date();
      return isActive ? sub : null;
    },
    enabled: !!user,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    const cached = sessionStorage.getItem("current_user");
    if (cached) {
      try {
        const { user: cachedUser, timestamp } = JSON.parse(cached);
        if (cachedUser && Date.now() - timestamp < 300000) { setUser(cachedUser); return; }
      } catch {}
    }
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (canceled) toast.info("Pago cancelado. Puedes volver a elegir un plan cuando quieras.", { duration: 5000 });
  }, [canceled]);

  useEffect(() => {
    if (!user || plans.length === 0) return;
    const pendingPlan = localStorage.getItem("pending_plan_selection");
    if (pendingPlan) {
      try {
        const planData = JSON.parse(pendingPlan);
        localStorage.removeItem("pending_plan_selection");
        const fullPlan = plans.find((p) => p.plan_id === planData.plan_id);
        if (fullPlan) handleSelectPlan(fullPlan);
      } catch {
        localStorage.removeItem("pending_plan_selection");
      }
    }
  }, [user]);

  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSelectPlan = async (plan) => {
    // En app nativa iOS no se puede usar Stripe — redirigir a web
    if (isNative) {
      window.open("https://misautonomos.es/precios", "_blank");
      return;
    }
    if (currentSubscription && user) {
      toast.error('Ya tienes una suscripción activa. Ve a "Mi Suscripción" para gestionarla.');
      navigate(createPageUrl("SubscriptionManagement"));
      return;
    }
    if (!user) {
      localStorage.setItem("pending_plan_selection", JSON.stringify({ plan_id: plan.plan_id, precio: plan.precio, timestamp: Date.now() }));
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    setSelectedPlan(plan.plan_id);
    setIsProcessing(true);
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado. Inténtalo de nuevo.")), 10000)
      );
      const response = await Promise.race([
        base44.functions.invoke("createCheckoutSession", {
          planId: plan.plan_id,
          planPrice: plan.precio,
          isReactivation: false,
        }),
        timeoutPromise,
      ]);
      if (response.data?.error) {
        if (response.data.redirect) { toast.error(response.data.error); navigate(response.data.redirect); return; }
        throw new Error(response.data.error);
      }
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else if (response.data?.sessionId) {
        window.location.href = `https://checkout.stripe.com/pay/${response.data.sessionId}`;
      } else {
        throw new Error("No se pudo crear la sesión de pago");
      }
    } catch (err) {
      toast.error(err.message || "Error al procesar el pago. Inténtalo de nuevo.");
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const getDisplayPrice = (basePrice) => {
    if (billing === "annual") return (basePrice * 0.8).toFixed(0);
    return basePrice;
  };

  const getAnnualSaving = (basePrice) => {
    return (basePrice * 12 * 0.2).toFixed(2);
  };

  const adsPlus = plans[1];

  return (
    <>
      <SEOHead
        title="Planes y Precios - MisAutónomos | 7 Días Gratis"
        description="Elige tu plan: Visibilidad 13€/mes o Ads+ 33€/mes con campañas incluidas. 7 días gratis. Sin permanencia. Sin comisiones."
        keywords="planes autónomos, precios profesionales, 7 días gratis, publicidad incluida, plan visibilidad"
      />
      <SubscriptionProductSchema plans={plans} />

      <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">

        {/* ── 1. BANNER URGENCIA ── */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white text-center py-3 px-4">
          <p className="text-sm font-semibold">
            🚀 Oferta de lanzamiento — <strong>7 días gratis · luego 1€ el primer mes · sin tarjeta requerida</strong>
          </p>
          <p className="text-xs text-green-100 mt-0.5">Sin permanencia · Cancela cuando quieras</p>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">

          {/* ── 2. HERO ── */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 leading-tight">
              Elige tu plan y empieza<br className="hidden md:block" /> a recibir clientes
            </h1>
            <p className="text-lg text-gray-500">
              Pago mensual sin permanencia. Cancela cuando quieras.
            </p>
          </div>

          {/* ── 3. TOGGLE MENSUAL/ANUAL ── */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <span className={`text-sm font-semibold ${billing === "monthly" ? "text-gray-900" : "text-gray-400"}`}>
              Mensual
            </span>
            <button
              onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${billing === "annual" ? "bg-blue-600" : "bg-gray-300"}`}
              aria-label="Cambiar facturación"
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${billing === "annual" ? "translate-x-6" : "translate-x-0"}`}
              />
            </button>
            <span className={`text-sm font-semibold ${billing === "annual" ? "text-blue-700" : "text-gray-400"}`}>
              Anual <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full ml-1">-20%</span>
            </span>
          </div>

          {/* ── AVISO iOS NATIVO ── */}
          {isNative && (
            <div className="max-w-2xl mx-auto mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
              <p className="text-sm font-semibold text-blue-900 mb-1">💳 Suscríbete desde la web</p>
              <p className="text-sm text-blue-700 mb-3">
                Para completar tu suscripción, visita nuestra web desde un navegador.
              </p>
              <a
                href="https://misautonomos.es/precios"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white font-bold px-6 py-3 rounded-xl text-sm"
              >
                Ir a misautonomos.es/precios →
              </a>
            </div>
          )}

          {/* ── 4. TARJETAS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto items-start">

            {/* Plan Visibilidad */}
            {(() => {
              const plan = plans[0];
              const isCurrentPlan = currentSubscription?.plan_id === plan.plan_id;
              const isLoading = isProcessing && selectedPlan === plan.plan_id;
              const displayPrice = getDisplayPrice(plan.precio);

              return (
                <div className="relative rounded-2xl bg-white border border-gray-200 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col overflow-hidden">
                  {isCurrentPlan && (
                    <div className="bg-green-600 text-white text-xs font-bold text-center py-2 tracking-wide uppercase">
                      ✓ Tu plan actual
                    </div>
                  )}
                  <div className="p-7 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-bold text-gray-900">{plan.nombre}</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-5">Hazte visible y consigue tus primeros clientes</p>

                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">🎁 7 días gratis</span>
                      </div>
                      <div className="flex items-end gap-1 mt-2">
                        <span className="text-4xl font-extrabold text-gray-900">1€</span>
                        <span className="text-gray-500 text-base mb-1.5">el primer mes</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Luego <span className="font-semibold text-gray-700">{plan.precio}€/mes</span>
                        {billing === "annual" && <span className="text-green-600 font-semibold"> ({getDisplayPrice(plan.precio)}€/mes anual)</span>}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Sin permanencia · Cancela cuando quieras</p>
                    </div>

                    {isCurrentPlan ? (
                      <Button disabled className="w-full h-12 text-base font-bold bg-green-600 text-white rounded-xl mb-6">
                        <CheckCircle className="w-5 h-5 mr-2" />Tu plan actual
                      </Button>
                    ) : currentSubscription ? (
                      <Button
                        className="w-full h-12 text-base font-bold bg-blue-700 hover:bg-blue-600 text-white rounded-xl mb-6"
                        onClick={() => navigate(createPageUrl("SubscriptionManagement"))}
                      >
                        Gestionar suscripción
                      </Button>
                    ) : (
                      <Button
                        className="w-full h-12 text-base font-bold rounded-xl mb-6 bg-green-600 hover:bg-green-500 text-white shadow-md"
                        onClick={() => handleSelectPlan(plan)}
                        disabled={isLoading}
                      >
                        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</> : "Empezar gratis 7 días →"}
                      </Button>
                    )}

                    <ul className="space-y-2.5 mb-5">
                      {PLAN_VISIBILITY_INCLUDES.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <ul className="space-y-2">
                      {PLAN_VISIBILITY_EXCLUDES.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-400">
                          <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}

            {/* Plan Ads+ — DESTACADO */}
            {(() => {
              const plan = plans[1];
              const isCurrentPlan = currentSubscription?.plan_id === plan.plan_id;
              const isLoading = isProcessing && selectedPlan === plan.plan_id;
              const displayPrice = getDisplayPrice(plan.precio);

              return (
                <div className="relative rounded-2xl bg-white border-2 border-blue-600 shadow-2xl ring-4 ring-blue-100 hover:shadow-[0_32px_64px_-16px_rgba(37,99,235,0.25)] transition-all duration-200 hover:-translate-y-1 md:scale-105 flex flex-col overflow-hidden">
                  {!isCurrentPlan && (
                    <div className="bg-blue-600 text-white text-xs font-bold text-center py-2 tracking-wide uppercase">
                      ⭐ Más elegido
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="bg-green-600 text-white text-xs font-bold text-center py-2 tracking-wide uppercase">
                      ✓ Tu plan actual
                    </div>
                  )}
                  <div className="p-7 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-bold text-gray-900">{plan.nombre}</h2>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-500">Máxima visibilidad con publicidad gestionada</p>
                      <Link to="/plan-ads" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
                        Saber más <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">🎁 7 días gratis</span>
                      </div>
                      <div className="flex items-end gap-1 mt-2">
                        <span className="text-4xl font-extrabold text-gray-900">1€</span>
                        <span className="text-gray-500 text-base mb-1.5">el primer mes</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Luego <span className="font-semibold text-gray-700">{plan.precio}€/mes</span>
                        {billing === "annual" && <span className="text-green-600 font-semibold"> ({getDisplayPrice(plan.precio)}€/mes anual)</span>}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Sin permanencia · Cancela cuando quieras</p>
                    </div>

                    {isCurrentPlan ? (
                      <Button disabled className="w-full h-12 text-base font-bold bg-green-600 text-white rounded-xl mb-6">
                        <CheckCircle className="w-5 h-5 mr-2" />Tu plan actual
                      </Button>
                    ) : currentSubscription ? (
                      <Button
                        className="w-full h-12 text-base font-bold bg-blue-700 hover:bg-blue-600 text-white rounded-xl mb-6"
                        onClick={() => navigate(createPageUrl("SubscriptionManagement"))}
                      >
                        Gestionar suscripción
                      </Button>
                    ) : (
                      <Button
                        id="cta-popular"
                        className="w-full h-12 text-base font-bold rounded-xl mb-6 bg-green-600 hover:bg-green-500 text-white shadow-lg"
                        onClick={() => handleSelectPlan(plan)}
                        disabled={isLoading}
                      >
                        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</> : "Empezar gratis 7 días →"}
                      </Button>
                    )}

                    <ul className="space-y-2.5">
                      {PLAN_ADSPLUS_INCLUDES.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className={i === 1 ? "font-semibold text-blue-700" : ""}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg p-3 mt-4">
                      💡 Visibility te hace aparecer. Ads+ te trae clientes activamente.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── 5. GARANTÍA ── */}
          <div className="max-w-3xl mx-auto mb-8 bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">🛡️ Sin permanencia · Cancela cuando quieras</h3>
              <p className="text-gray-600 text-sm">
                No hay contratos ni letra pequeña. Si no recibes ningún contacto en los primeros 30 días,
                <strong className="text-green-700"> te devolvemos el dinero</strong>. Sin preguntas.
              </p>
            </div>
          </div>

          {/* ── 6. POSICIONAMIENTO HONESTO ── */}
          <div className="max-w-3xl mx-auto mb-12 bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Rocket className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">🚀 Sé de los primeros en unirte</h3>
              <p className="text-gray-600 text-sm">
                MisAutónomos es una plataforma recién lanzada. Únete ahora y posiciónate antes que la competencia en tu zona.
              </p>
            </div>
          </div>

          {/* ── 7. FAQ ── */}
          <div className="max-w-2xl mx-auto mb-12">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Preguntas frecuentes sobre el pago</h3>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-gray-900 text-sm hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    {openFaq === i
                      ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legal */}
          <p className="text-xs text-gray-400 text-center max-w-2xl mx-auto">
          Los primeros 7 días son gratis. Tras el trial, se cobra 1€ el primer mes (cupón de bienvenida aplicado automáticamente). A partir del segundo mes, el precio normal del plan (13€/mes Visibilidad · 33€/mes Ads+). Si no cancelas antes del final del trial, no se cobra nada hasta el día 7.
          Plan Ads+: gestión publicitaria incluida en Instagram, Facebook y TikTok. Resultados sujetos a demanda local.
          </p>
        </div>
      </div>

      {/* ── 8. STICKY CTA MÓVIL ── */}
      {stickyVisible && !currentSubscription && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 px-4 py-3 shadow-2xl" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-gray-900">Plan Ads+ · 1€ el primer mes</p>
              <p className="text-xs text-gray-400">7 días gratis · luego 33€/mes</p>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 h-11 rounded-xl shadow-lg flex-shrink-0"
              onClick={() => {
                const btn = document.getElementById("cta-popular");
                if (btn) btn.click();
                else if (adsPlus) handleSelectPlan(adsPlus);
              }}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Empezar gratis →"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}