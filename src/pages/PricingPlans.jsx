import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, XCircle, Loader2, ArrowLeft, Shield, Star, Users,
  Briefcase, TrendingUp, Sparkles, ChevronDown, ChevronUp, Zap, Gift
} from "lucide-react";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";
import SubscriptionProductSchema from "../components/seo/SubscriptionProductSchema";

// ─── Features con includes/excludes por plan ────────────────────────────────
const PLAN_FEATURES = {
  plan_visibility: {
    includes: [
      "Perfil visible en búsquedas de clientes",
      "Ficha pública completa con fotos y servicios",
      "Contacto directo: WhatsApp y llamadas",
      "Zona de cobertura geográfica",
      "Valoraciones y reseñas de clientes",
      "Edición ilimitada del perfil",
    ],
    excludes: [
      "Dashboard Pro de gestión",
      "Presupuestos y facturación",
      "Campañas publicitarias en redes sociales",
      "CRM de clientes y proyectos",
    ],
  },
  plan_adsplus: {
    includes: [
      "Todo lo incluido en Plan Visibilidad",
      "Dashboard Pro: gestión completa",
      "Presupuestos y facturación automática",
      "CRM de clientes, proyectos y tareas",
      "Campañas en Instagram, Facebook y TikTok",
      "Inversión publicitaria gestionada por nuestro equipo",
      "Resumen de rendimiento de campañas",
      "Soporte prioritario",
    ],
    excludes: [],
  },
};

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "¿Cuándo se cobra el plan?",
    a: "Tienes 7 días completamente gratis. No se te cobra nada hasta que termine ese período. Después, el cobro es mensual automático el mismo día de cada mes.",
  },
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí, sin permanencia ni penalizaciones. Cancelas desde tu panel en un clic y no se te cobra el siguiente mes. Mantienes el acceso hasta el final del período pagado.",
  },
  {
    q: "¿Hay comisiones por cada cliente o trabajo?",
    a: "No. Pagas solo la cuota mensual fija. Los clientes contactan directamente contigo y los acuerdos económicos son 100% entre tú y el cliente. Nosotros no cobramos comisión.",
  },
  {
    q: "¿Qué pasa si no cancelo y expira el período gratis?",
    a: "Al finalizar los 7 días gratuitos, si no has cancelado, se activará el cobro automático del plan elegido. Te avisaremos por email antes de que termine el período gratuito.",
  },
];

export default function PricingPlansPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  const canceled = searchParams.get("canceled");

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: async () => {
      const allPlans = await base44.entities.SubscriptionPlan.list();
      return allPlans
        .filter((p) => p.plan_id === "plan_visibility" || p.plan_id === "plan_adsplus")
        .sort((a, b) => a.precio - b.precio);
    },
    staleTime: 1000 * 60 * 10,
  });

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

  useEffect(() => { loadUser(); }, []);

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
  }, [user, plans]);

  // Sticky button aparece al hacer scroll
  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const loadUser = async () => {
    try { setUser(await base44.auth.me()); } catch { setUser(null); }
  };

  const handleSelectPlan = async (plan) => {
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
      const response = await base44.functions.invoke("createCheckoutSession", {
        planId: plan.plan_id,
        planPrice: plan.precio,
        isReactivation: false,
      });
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

  const adsPlus = plans.find((p) => p.plan_id === "plan_adsplus");
  const visibilidad = plans.find((p) => p.plan_id === "plan_visibility");

  // Ahorro anual simulado para anchoring
  const annualSavingAdsPlus = adsPlus ? Math.round(adsPlus.precio * 2) : 66;
  const annualSavingVisibilidad = visibilidad ? Math.round(visibilidad.precio * 2) : 26;

  if (loadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Planes y Precios - MisAutónomos | 7 Días Gratis"
        description="Elige tu plan: Visibilidad 13€/mes o Ads+ 33€/mes con campañas incluidas. 7 días gratis. Sin permanencia. Sin comisiones."
        keywords="planes autónomos, precios profesionales, 7 días gratis, publicidad incluida, plan visibilidad"
      />
      <SubscriptionProductSchema plans={plans} />

      <div className="min-h-screen bg-gray-50">

        {/* ── Banner urgencia ── */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center py-3 px-4">
          <p className="text-sm font-semibold flex items-center justify-center gap-2">
            <Gift className="w-4 h-4 flex-shrink-0" />
            Oferta de lanzamiento — <strong>7 días gratis</strong> sin tarjeta de crédito &nbsp;·&nbsp; Plazas limitadas
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">

          {/* Volver */}
          <Button variant="ghost" onClick={() => navigate(createPageUrl("Search"))} className="mb-6 hover:bg-blue-50 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />Volver
          </Button>

          {/* ── Hero ── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              7 días gratis · Sin tarjeta · Sin permanencia
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 leading-tight">
              Empieza a recibir clientes<br className="hidden md:block" /> <span className="text-blue-700">hoy mismo</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Sin comisiones. Contacto directo con tus clientes. Cancela cuando quieras.
            </p>
          </div>

          {/* ── Social proof ── */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span><strong className="text-gray-900">Contacto directo</strong> con clientes</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Shield className="w-5 h-5 text-green-600" />
              <span><strong className="text-gray-900">Sin comisiones</strong> por trabajo</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span><strong className="text-gray-900">Verificados</strong> · Nueva plataforma</span>
            </div>
          </div>

          {/* ── Tarjetas de planes ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
            {plans.map((plan) => {
              const features = PLAN_FEATURES[plan.plan_id] || { includes: [], excludes: [] };
              const isPopular = plan.plan_id === "plan_adsplus";
              const isCurrentPlan = currentSubscription?.plan_id === plan.plan_id;
              const annualSaving = plan.plan_id === "plan_adsplus" ? annualSavingAdsPlus : annualSavingVisibilidad;
              const isLoading = isProcessing && selectedPlan === plan.plan_id;

              return (
                <div
                  key={plan.plan_id}
                  className={`relative rounded-2xl bg-white flex flex-col overflow-hidden transition-shadow duration-200 ${
                    isPopular
                      ? "border-2 border-blue-600 shadow-2xl ring-4 ring-blue-100"
                      : "border border-gray-200 shadow-md hover:shadow-lg"
                  }`}
                >
                  {/* Badge */}
                  {isPopular && !isCurrentPlan && (
                    <div className="bg-blue-600 text-white text-xs font-bold text-center py-2 tracking-wide uppercase">
                      ⭐ Más elegido · Mayor retorno
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="bg-green-600 text-white text-xs font-bold text-center py-2 tracking-wide uppercase">
                      ✓ Tu plan actual
                    </div>
                  )}

                  <div className="p-7 flex flex-col flex-1">
                    {/* Nombre + anchoring */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-1">
                        {plan.plan_id === "plan_visibility"
                          ? <Briefcase className="w-5 h-5 text-blue-600" />
                          : <TrendingUp className="w-5 h-5 text-blue-600" />}
                        <h2 className="text-lg font-bold text-gray-900">{plan.nombre}</h2>
                      </div>
                      {/* Anchoring: ahorro anual */}
                      <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full mt-1">
                        <Gift className="w-3.5 h-3.5" />
                        Ahorra {annualSaving}€ vs precio sin oferta
                      </div>
                    </div>

                    {/* Precio */}
                    <div className="mb-6">
                      <div className="flex items-end gap-1">
                        <span className="text-5xl font-extrabold text-gray-900">{plan.precio}€</span>
                        <span className="text-gray-500 text-base mb-2">/mes</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Los primeros 7 días son gratis</p>
                    </div>

                    {/* CTA */}
                    {isCurrentPlan ? (
                      <Button disabled className="w-full h-12 text-base font-bold bg-green-600 text-white rounded-xl mb-6 cursor-default">
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
                        className={`w-full h-12 text-base font-bold rounded-xl mb-6 ${
                          isPopular
                            ? "bg-green-600 hover:bg-green-500 text-white shadow-lg"
                            : "bg-blue-700 hover:bg-blue-600 text-white"
                        }`}
                        onClick={() => handleSelectPlan(plan)}
                        disabled={isLoading}
                        id={isPopular ? "cta-popular" : undefined}
                      >
                        {isLoading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</>
                        ) : (
                          <>Empezar gratis 7 días →</>
                        )}
                      </Button>
                    )}

                    {/* Features incluidas */}
                    <ul className="space-y-2.5 mb-4">
                      {features.includes.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Features excluidas */}
                    {features.excludes.length > 0 && (
                      <ul className="space-y-2 mt-2">
                        {features.excludes.map((f, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-400">
                            <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Sin permanencia / Garantía ── */}
          <div className="max-w-3xl mx-auto mb-12 bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Sin permanencia — cancela cuando quieras</h3>
              <p className="text-gray-600 text-sm">
                No hay contratos ni letra pequeña. Si no recibes ningún contacto de cliente en los primeros 30 días, 
                <strong className="text-green-700"> te devolvemos el dinero</strong>. Sin preguntas.
              </p>
            </div>
          </div>

          {/* ── Testimonios rápidos ── */}
          <div className="max-w-3xl mx-auto mb-12">
            <h3 className="text-center text-lg font-bold text-gray-700 mb-6">Lo que dicen nuestros autónomos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Carlos M.", role: "Electricista · Madrid", text: "En la primera semana ya tenía 3 presupuestos pedidos. Merece la pena.", stars: 5 },
                { name: "Laura G.", role: "Nutricionista · Barcelona", text: "Contacto directo, sin comisiones. Por fin una plataforma honesta.", stars: 5 },
                { name: "Javier P.", role: "Fontanero · Sevilla", text: "Con el plan Ads+ multipliqué por 4 mis contactos en un mes.", stars: 5 },
              ].map((t, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 italic mb-3">"{t.text}"</p>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ de precios ── */}
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
            Los primeros 7 días son gratis. Si no cancelas antes, se cobra automáticamente el plan elegido. 
            Plan Ads+: gestión publicitaria incluida en Instagram, Facebook y TikTok. Resultados sujetos a demanda local.
          </p>
        </div>
      </div>

      {/* ── Sticky CTA móvil ── */}
      {stickyVisible && !currentSubscription && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 px-4 py-3 shadow-2xl">
          <Button
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl shadow-lg"
            onClick={() => {
              const btn = document.getElementById("cta-popular");
              if (btn) btn.click();
              else if (plans[1]) handleSelectPlan(plans[1]);
            }}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Empezar gratis 7 días →"}
          </Button>
          <p className="text-xs text-center text-gray-400 mt-1">Sin tarjeta · Sin permanencia · Cancela cuando quieras</p>
        </div>
      )}
    </>
  );
}