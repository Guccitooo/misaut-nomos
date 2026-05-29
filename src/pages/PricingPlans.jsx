import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, XCircle, Loader2, Shield, Briefcase,
  TrendingUp, ChevronDown, ChevronUp, Rocket, ChevronRight, Zap
} from "lucide-react";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";

const PLAN_FREE_INCLUDES = [
  "Perfil visible en búsquedas de toda España",
  "Foto, descripción y servicios completos",
  "Contacto directo: WhatsApp, llamada y chat",
  "Mensajes ilimitados con clientes",
  "Estadísticas de visitas a tu perfil",
  "Zona de cobertura geográfica",
  "Valoraciones y reseñas",
  "Acceso permanente · Sin tarjeta",
];

const PLAN_FREE_EXCLUDES = [
  "Campañas en redes sociales",
  "Posicionamiento destacado",
  "Soporte prioritario",
];

const PLAN_ADSPLUS_INCLUDES = [
  "Todo lo del Plan Gratuito ✓",
  "30€/mes de presupuesto publicitario REAL invertido en tu campaña",
  "Briefing mensual guiado (eliges red y objetivo cada mes)",
  "Campaña en Instagram, Facebook, TikTok, LinkedIn o Google",
  "Creatividades profesionales hechas por nosotros",
  "Copy publicitario optimizado",
  "Gestión y optimización activa durante todo el mes",
  "Reporte semanal de resultados con métricas reales",
  "Soporte prioritario",
];

const FAQS = [
  {
    q: "¿El plan gratuito es realmente gratis?",
    a: "Sí, completamente gratis y sin tarjeta. Tu perfil aparece en búsquedas de forma permanente sin pagar nada.",
  },
  {
    q: "¿Cuándo se me cobra algo?",
    a: "Solo si contratas el Plan Ads+. El plan base nunca tiene coste.",
  },
  {
    q: "¿Hay comisiones por cliente conseguido?",
    a: "No. Lo que ganes con tus clientes es 100% tuyo.",
  },
  {
    q: "¿Puedo cancelar el Plan Ads+ cuando quiera?",
    a: "Sí, sin permanencia. Cancela desde tu panel en un clic. Tu perfil gratuito sigue activo.",
  },
];

export default function PricingPlansPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  const canceled = searchParams.get("canceled");

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
    if (canceled) toast.info("Pago cancelado. Puedes volver a elegir el Plan Ads+ cuando quieras.", { duration: 5000 });
  }, [canceled]);

  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleFreeSignup = () => {
    if (!user) {
      base44.auth.redirectToLogin('/completar-perfil');
      return;
    }
    navigate('/completar-perfil');
  };

  const handleAdsPlus = async () => {
    if (!user) {
      sessionStorage.setItem('pendingPlanId', 'plan_adsplus');
      base44.auth.redirectToLogin('/precios?plan=plan_adsplus');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await Promise.race([
        base44.functions.invoke("createCheckoutSession", {
          planId: 'plan_adsplus',
          planPrice: 33,
          isReactivation: false,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Tiempo agotado")), 15000)),
      ]);
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error(response.data?.error || "No se pudo crear la sesión de pago");
      }
    } catch (err) {
      toast.error(err.message || "Error al procesar. Inténtalo de nuevo.");
      setIsProcessing(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Planes y Precios - MisAutónomos | Gratis para autónomos"
        description="Regístrate gratis y empieza a recibir clientes. Sin tarjeta, sin permanencia. Plan Ads+ a 33€/mes con publicidad gestionada incluida."
        keywords="registro gratis autónomos, directorio profesionales gratis, Plan Ads+ publicidad autónomos"
      />

      <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">

        {/* BANNER */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white text-center py-3 px-4">
          <p className="text-sm font-semibold">
            🎉 <strong>Acceso gratuito permanente</strong> — Sin tarjeta, sin permanencia, sin sorpresas
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">

          {/* HERO */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 leading-tight">
              Tu perfil en MisAutónomos<br className="hidden md:block" /> es completamente <span className="text-green-600">gratis</span>
            </h1>
            <p className="text-lg text-gray-500">
              Regístrate hoy y empieza a recibir clientes. Sin tarjeta, sin límite de tiempo.
            </p>
          </div>

          {/* CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto items-start">

            {/* Plan Gratuito */}
            <div className="relative rounded-2xl bg-white border border-gray-200 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col overflow-hidden">
              <div className="bg-green-600 text-white text-xs font-bold text-center py-2 tracking-wide uppercase">
                ✓ Tu plan por defecto
              </div>
              <div className="p-7 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-bold text-gray-900">Plan Gratuito</h2>
                </div>
                <p className="text-sm text-gray-500 mb-5">Hazte visible y consigue tus primeros clientes</p>

                <div className="mb-6">
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-4xl font-extrabold text-gray-900">0€</span>
                    <span className="text-gray-500 text-base mb-1.5">/mes · siempre</span>
                  </div>
                  <p className="text-xs text-green-700 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Sin tarjeta · Sin permanencia · Acceso permanente
                  </p>
                </div>

                <Button
                  className="w-full h-12 text-base font-bold rounded-xl mb-6 bg-green-600 hover:bg-green-500 text-white shadow-md"
                  onClick={handleFreeSignup}
                >
                  Crear mi perfil gratis →
                </Button>

                <ul className="space-y-2.5 mb-5">
                  {PLAN_FREE_INCLUDES.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <ul className="space-y-2">
                  {PLAN_FREE_EXCLUDES.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Plan Ads+ */}
            <div className="relative rounded-2xl bg-white border-2 border-blue-600 shadow-2xl ring-4 ring-blue-100 hover:shadow-[0_32px_64px_-16px_rgba(37,99,235,0.25)] transition-all duration-200 hover:-translate-y-1 md:scale-105 flex flex-col overflow-hidden">
              <div className="bg-blue-600 text-white text-xs font-bold text-center py-2 tracking-wide uppercase">
                ⭐ Publicidad gestionada
              </div>
              <div className="p-7 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Plan Ads+</h2>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">Máxima visibilidad con publicidad gestionada</p>
                  <Link to="/plan-ads" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
                    Saber más <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-4xl font-extrabold text-gray-900">33€</span>
                    <span className="text-gray-500 text-base mb-1.5">/mes</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Sin permanencia · Cancela cuando quieras</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">💳 Incluye 30€/mes de inversión publicitaria real</p>
                </div>

                <Button
                  id="cta-adsplus"
                  className="w-full h-12 text-base font-bold rounded-xl mb-6 bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
                  onClick={handleAdsPlus}
                  disabled={isProcessing}
                >
                  {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</> : "Añadir publicidad →"}
                </Button>

                <ul className="space-y-2.5">
                  {PLAN_ADSPLUS_INCLUDES.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className={i === 1 ? "font-semibold text-blue-700" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg p-3 mt-4">
                  💡 El plan gratuito te hace aparecer. Ads+ te trae clientes activamente.
                </p>
              </div>
            </div>
          </div>

          {/* GARANTÍA */}
          <div className="max-w-3xl mx-auto mb-8 bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">🛡️ Acceso gratuito garantizado · Sin letra pequeña</h3>
              <p className="text-gray-600 text-sm">
                El plan base es gratuito para siempre. Solo pagas si eliges el Plan Ads+ de publicidad gestionada.
                Sin compromisos, sin sorpresas.
              </p>
            </div>
          </div>

          {/* POSICIONAMIENTO */}
          <div className="max-w-3xl mx-auto mb-12 bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Rocket className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">🚀 Sé de los primeros en unirte</h3>
              <p className="text-gray-600 text-sm">
                MisAutónomos es una plataforma en crecimiento. Únete ahora gratis y posiciónate antes que la competencia en tu zona.
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto mb-12">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Preguntas frecuentes</h3>
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
            El plan base (directorio y perfil) es gratuito e indefinido. El Plan Ads+ (33€/mes) incluye gestión publicitaria en Instagram, Facebook, TikTok, LinkedIn y Google, con 30€/mes de inversión real. Resultados sujetos a demanda local. Sin permanencia, cancela cuando quieras.
          </p>
        </div>
      </div>

      {/* STICKY CTA MÓVIL */}
      {stickyVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 px-4 py-3 shadow-2xl" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-gray-900">¡Es gratis!</p>
              <p className="text-xs text-gray-400">Sin tarjeta · Sin permanencia</p>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 h-11 rounded-xl shadow-lg flex-shrink-0"
              onClick={handleFreeSignup}
            >
              Crear perfil gratis →
            </Button>
          </div>
        </div>
      )}
    </>
  );
}