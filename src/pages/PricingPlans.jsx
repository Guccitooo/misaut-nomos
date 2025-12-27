import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Check, Star, TrendingUp, Megaphone, Shield, FileText, BarChart3, Zap, Users, Crown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";
import { useLanguage } from "../components/ui/LanguageSwitcher";

// CONFIGURACIÓN DE PLANES
// TODO: Configurar estos Price IDs en tu Dashboard de Stripe
const PLANS_CONFIG = {
  profesional: {
    name: "Plan Profesional",
    price: 30,
    stripePriceId: "price_profesional_30", // ⚠️ Reemplazar con tu Price ID real de Stripe
    interval: "mes",
    popular: false,
    icon: Star,
    gradient: "from-blue-600 to-blue-700",
    features: [
      { text: "Perfil verificado en el directorio", included: true },
      { text: "Presencia prioritaria en búsquedas", included: true },
      { text: "Sistema de facturación electrónica", included: true },
      { text: "Gestión de presupuestos ilimitados", included: true },
      { text: "CRM para gestión de clientes", included: true },
      { text: "Chat directo con clientes", included: true },
      { text: "Sistema de valoraciones", included: true },
      { text: "Galería de fotos ilimitada", included: true },
      { text: "Soporte por tickets 24/7", included: true },
      { text: "Campaña publicitaria gestionada", included: false }
    ]
  },
  growth: {
    name: "Plan Growth",
    price: 50,
    stripePriceId: "price_growth_50", // ⚠️ Reemplazar con tu Price ID real de Stripe
    interval: "mes",
    popular: true,
    icon: Megaphone,
    gradient: "from-green-600 to-emerald-600",
    badge: "Recomendado",
    adBudget: 20,
    features: [
      { text: "Todo lo incluido en Plan Profesional", included: true, highlight: true },
      { text: "20€/mes invertidos en publicidad", included: true, highlight: true },
      { text: "Anuncios en Facebook e Instagram Ads", included: true, highlight: true },
      { text: "Configuración técnica por MisAutónomos", included: true, highlight: true },
      { text: "Segmentación local automática", included: true, highlight: true },
      { text: "Reportes mensuales de resultados", included: true, highlight: true },
      { text: "Optimización continua de campañas", included: true, highlight: true },
      { text: "Mayor visibilidad y más clientes", included: true, highlight: true }
    ]
  }
};

export default function PricingPlansPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canceled = searchParams.get("canceled");

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (canceled) {
      toast.info("Pago cancelado. Puedes volver a elegir un plan cuando quieras.", {
        duration: 5000
      });
    }
  }, [canceled]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const handleSelectPlan = async (planKey) => {
    const plan = PLANS_CONFIG[planKey];
    
    if (!user) {
      localStorage.setItem('pending_plan_selection', JSON.stringify({
        plan_key: planKey,
        precio: plan.price,
        timestamp: Date.now()
      }));
      
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setSelectedPlan(planKey);
    setIsProcessing(true);

    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        stripePriceId: plan.stripePriceId,
        planName: plan.name,
        planPrice: plan.price,
        isReactivation: false
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No se pudo crear la sesión de pago');
      }
    } catch (err) {
      console.error('Error en checkout:', err);
      toast.error(err.message || "Error al procesar el pago. Inténtalo de nuevo.");
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  return (
    <>
      <SEOHead 
        title="Planes y Precios - Aumenta tus Clientes | MisAutónomos"
        description="Plan Profesional 30€/mes: Presencia verificada. Plan Growth 50€/mes: + 20€ en publicidad gestionada. Sin permanencia, cancela cuando quieras."
        keywords="planes autónomos, precio directorio, publicidad autónomos, facebook ads, instagram ads, facturación autónomos"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Search"))}
            className="mb-6 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge className="bg-green-500 text-white px-6 py-2 text-sm font-bold mb-4">
              🚀 Sin permanencia • Cancela cuando quieras
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4 leading-tight">
              Aumenta tus Clientes con<br />MisAutónomos
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Presencia verificada en el directorio líder de autónomos en España. 
              Recibe solicitudes de clientes reales, gestiona tus presupuestos y facturas desde un solo lugar.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Pago 100% seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>+5.000 búsquedas diarias</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <span>Activo en minutos</span>
              </div>
            </div>
          </div>

          {canceled && (
            <Alert className="mb-6 max-w-2xl mx-auto bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-900">
                Pago cancelado. No te preocupes, puedes volver cuando quieras.
              </AlertDescription>
            </Alert>
          )}

          {/* TABLA COMPARATIVA DE PLANES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-5xl mx-auto">
            {Object.entries(PLANS_CONFIG).map(([key, plan]) => {
              const Icon = plan.icon;
              const isGrowth = key === 'growth';
              
              return (
                <Card 
                  key={key}
                  className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                    plan.popular ? "border-green-500 shadow-xl scale-105 z-10" : "border-gray-200"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute top-0 left-0 right-0">
                      <div className={`bg-gradient-to-r ${plan.gradient} text-white text-center py-2 text-sm font-bold`}>
                        ⭐ {plan.badge}
                      </div>
                    </div>
                  )}

                  <CardContent className={`p-8 ${plan.badge ? 'pt-14' : 'pt-8'}`}>
                    <div className="text-center mb-6">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br ${plan.gradient} text-white`}>
                        <Icon className="w-10 h-10" />
                      </div>

                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </h2>

                      <div className="mb-4">
                        <p className="text-5xl font-black text-gray-900">
                          {plan.price}€
                        </p>
                        <p className="text-gray-600 font-medium">
                          al mes
                        </p>
                      </div>

                      {isGrowth && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-3 mb-4">
                          <p className="text-sm font-bold text-green-700 flex items-center justify-center gap-2">
                            <Megaphone className="w-4 h-4" />
                            Incluye 20€/mes en publicidad gestionada
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Nosotros configuramos y optimizamos tus anuncios
                          </p>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className={`flex items-start gap-3 text-sm ${feature.highlight ? 'font-semibold' : ''}`}>
                          <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            feature.included 
                              ? (feature.highlight ? 'text-green-600' : 'text-blue-600')
                              : 'text-gray-300'
                          }`} />
                          <span className={feature.included ? 'text-gray-900' : 'text-gray-400'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full h-12 text-base font-bold transition-all shadow-lg ${
                        plan.popular 
                          ? `bg-gradient-to-r ${plan.gradient} hover:shadow-xl` 
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                      onClick={() => handleSelectPlan(key)}
                      disabled={isProcessing && selectedPlan === key}
                    >
                      {isProcessing && selectedPlan === key ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          {plan.popular && <Crown className="w-5 h-5 mr-2" />}
                          Empezar ahora
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500 mt-3">
                      Pago seguro con Stripe • Sin permanencia
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* TABLA COMPARATIVA DETALLADA */}
          <div className="max-w-5xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Comparativa de Planes
            </h2>
            
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <th className="px-6 py-4 text-left font-bold text-gray-900">Funcionalidad</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-900">
                        Profesional<br />
                        <span className="text-2xl">30€</span>
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-green-700 bg-green-50">
                        Growth 🌟<br />
                        <span className="text-2xl">50€</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-gray-900 font-medium">Perfil en directorio MisAutónomos</td>
                      <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                      <td className="px-6 py-4 text-center bg-green-50"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-gray-900 font-medium">Sistema de facturación electrónica</td>
                      <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                      <td className="px-6 py-4 text-center bg-green-50"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-gray-900 font-medium">CRM y gestión de clientes</td>
                      <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                      <td className="px-6 py-4 text-center bg-green-50"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-gray-900 font-medium">Presupuestos ilimitados</td>
                      <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                      <td className="px-6 py-4 text-center bg-green-50"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-gray-900 font-medium">Valoraciones de clientes</td>
                      <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                      <td className="px-6 py-4 text-center bg-green-50"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="px-6 py-4 text-gray-900 font-bold">
                        <div className="flex items-center gap-2">
                          <Megaphone className="w-5 h-5 text-green-600" />
                          Inversión publicitaria mensual
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-400 font-medium">—</td>
                      <td className="px-6 py-4 text-center bg-green-100">
                        <span className="font-bold text-green-700">20€/mes</span>
                      </td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="px-6 py-4 text-gray-900 font-medium">Configuración técnica de anuncios</td>
                      <td className="px-6 py-4 text-center text-gray-400">—</td>
                      <td className="px-6 py-4 text-center bg-green-100"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="px-6 py-4 text-gray-900 font-medium">Anuncios en Facebook e Instagram</td>
                      <td className="px-6 py-4 text-center text-gray-400">—</td>
                      <td className="px-6 py-4 text-center bg-green-100"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="px-6 py-4 text-gray-900 font-medium">Reportes de rendimiento publicitario</td>
                      <td className="px-6 py-4 text-center text-gray-400">—</td>
                      <td className="px-6 py-4 text-center bg-green-100"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* BENEFICIOS DEL PLAN GROWTH */}
          <div className="max-w-5xl mx-auto mb-12">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <Badge className="bg-green-600 text-white px-4 py-1 mb-3">
                    Plan Growth
                  </Badge>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    ¿Por qué invertir 20€ más al mes?
                  </h2>
                  <p className="text-gray-700">
                    Tu tiempo vale más que configurar anuncios. Nosotros lo hacemos por ti.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <TrendingUp className="w-10 h-10 text-green-600 mb-3" />
                    <h3 className="font-bold text-gray-900 mb-2">Mayor alcance</h3>
                    <p className="text-sm text-gray-600">
                      Tus servicios aparecen en Facebook e Instagram ante miles de potenciales clientes en tu zona
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <Zap className="w-10 h-10 text-green-600 mb-3" />
                    <h3 className="font-bold text-gray-900 mb-2">Sin complicaciones</h3>
                    <p className="text-sm text-gray-600">
                      Olvidate de configurar píxeles, audiencias o pujas. Nosotros gestionamos todo técnicamente
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <BarChart3 className="w-10 h-10 text-green-600 mb-3" />
                    <h3 className="font-bold text-gray-900 mb-2">Resultados medibles</h3>
                    <p className="text-sm text-gray-600">
                      Recibe reportes mensuales de impresiones, clics y conversiones de tu campaña
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 mt-6 border-2 border-green-300">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <strong className="text-green-700">💰 Inversión real:</strong> Los 20€ van íntegros a Meta (Facebook/Instagram). 
                    Tú pagas 50€/mes en total: 30€ por tu presencia en MisAutónomos + 20€ que nosotros invertimos directamente en tu publicidad.
                    <br /><br />
                    <strong className="text-green-700">⚙️ Configuración técnica incluida:</strong> Creamos tus anuncios, segmentamos tu audiencia local, optimizamos pujas y te enviamos reportes. 
                    Sin costes ocultos ni sorpresas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ ESPECÍFICA PLANES */}
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Preguntas Frecuentes
            </h2>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Qué incluye el Plan Profesional de 30€/mes?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    Tu perfil verificado aparece en el directorio de MisAutónomos, donde más de 5.000 personas buscan profesionales cada día. 
                    Incluye herramientas de facturación electrónica, gestión de presupuestos, CRM para clientes, chat directo y sistema de valoraciones. 
                    Todo lo que necesitas para digitalizar tu negocio como autónomo.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-green-600" />
                    ¿Cómo funcionan los 20€ de publicidad del Plan Growth?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">
                    <strong className="text-green-700">Inversión directa:</strong> Los 20€ adicionales se invierten íntegramente en Facebook Ads e Instagram Ads cada mes para promocionar tu perfil específico.
                  </p>
                  <p className="text-gray-700 mb-3">
                    <strong className="text-green-700">Nosotros gestionamos:</strong> Nuestro equipo configura la campaña, crea los anuncios, segmenta la audiencia local (radio de 20-50km según tu zona de servicio), optimiza las pujas y monitoriza los resultados.
                  </p>
                  <p className="text-gray-700 mb-3">
                    <strong className="text-green-700">Reportes mensuales:</strong> Recibes un informe con impresiones, clics, clientes potenciales generados y coste por resultado.
                  </p>
                  <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    ⚠️ <strong>Importante:</strong> Los resultados dependen del mercado, la competencia en tu zona y la época del año. 
                    MisAutónomos no garantiza un número específico de clientes, pero optimizamos constantemente para maximizar tu retorno de inversión.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Puedo cambiar de plan o cancelar cuando quiera?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    Sí, sin permanencia. Puedes cambiar de Plan Profesional a Growth (o viceversa) o cancelar tu suscripción en cualquier momento desde tu panel de control. 
                    No hay penalizaciones ni costes adicionales. Si cancelas, tu perfil permanecerá activo hasta el final del período ya pagado.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Qué pasa si mi categoría tiene mucha competencia?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    Con el Plan Growth, tus anuncios llegan más allá del directorio orgánico. Mientras que en el Plan Profesional solo apareces cuando alguien busca en MisAutónomos, 
                    con Growth tus servicios se muestran activamente en Facebook e Instagram a usuarios que aún no conocen la plataforma, multiplicando tu alcance.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Los clientes pueden contactarme directamente?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    Sí, con ambos planes. Los clientes ven tu perfil con tus métodos de contacto preferidos (chat interno, WhatsApp, teléfono) y pueden solicitarte presupuestos directamente. 
                    Tú decides cómo y cuándo responder.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Necesito conocimientos técnicos para usar la plataforma?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    No. MisAutónomos está diseñado para autónomos sin conocimientos técnicos. 
                    La facturación electrónica cumple con Hacienda automáticamente, el sistema de presupuestos es intuitivo y el soporte está disponible 24/7 vía tickets.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ROI CALCULATOR SECTION */}
          <div className="max-w-4xl mx-auto mb-12">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-0 shadow-xl">
              <CardContent className="p-8 text-center">
                <h2 className="text-3xl font-bold mb-4">
                  Recupera tu inversión con solo 1 cliente al mes
                </h2>
                <p className="text-blue-100 text-lg mb-6">
                  Si tu servicio promedio genera 150-300€, el retorno de inversión es inmediato. 
                  Con el Plan Growth, la publicidad te ayuda a conseguir 2-5 clientes extra cada mes.
                </p>
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                    <p className="text-3xl font-bold">30€</p>
                    <p className="text-sm text-blue-100">Inversión mensual mínima</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                    <p className="text-3xl font-bold">+3-5x</p>
                    <p className="text-sm text-blue-100">Más visibilidad con Growth</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                    <p className="text-3xl font-bold">∞</p>
                    <p className="text-sm text-blue-100">Presupuestos sin límite</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* GARANTÍAS Y CONFIANZA */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Pago 100% seguro</h3>
                      <p className="text-sm text-gray-600">
                        Procesamos pagos con Stripe, la plataforma más segura del mundo. Tus datos bancarios están protegidos con cifrado de nivel bancario.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Factura oficial</h3>
                      <p className="text-sm text-gray-600">
                        Recibes factura oficial en cada pago. Puedes deducir el 100% del coste como gasto de tu actividad profesional en la declaración trimestral.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* TESTIMONIOS SIMULADOS */}
          <div className="max-w-5xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Lo que dicen nuestros autónomos
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm mb-4">
                    "Con el Plan Growth he conseguido 4 clientes nuevos en el primer mes. Los 20€ de publicidad se pagan solos."
                  </p>
                  <p className="text-xs text-gray-500 font-semibold">
                    Carlos M. • Electricista en Madrid
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm mb-4">
                    "El sistema de facturación me ahorra horas cada mes. Y los presupuestos quedan super profesionales."
                  </p>
                  <p className="text-xs text-gray-500 font-semibold">
                    Laura P. • Pintora en Valencia
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm mb-4">
                    "Antes pagaba 80€/mes en anuncios sin saber si funcionaban. Ahora con 50€ tengo todo: directorio + publicidad + facturación."
                  </p>
                  <p className="text-xs text-gray-500 font-semibold">
                    Miguel R. • Fontanero en Sevilla
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA FINAL */}
          <div className="max-w-3xl mx-auto text-center">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 shadow-2xl">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  ¿Listo para aumentar tus clientes?
                </h2>
                <p className="text-blue-100 mb-6">
                  Únete a cientos de autónomos que ya están creciendo con MisAutónomos
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => handleSelectPlan('profesional')}
                    className="bg-white hover:bg-gray-100 text-blue-700 h-12 px-8 font-bold"
                    disabled={isProcessing}
                  >
                    Empezar con 30€/mes
                  </Button>
                  <Button
                    onClick={() => handleSelectPlan('growth')}
                    className="bg-green-600 hover:bg-green-700 text-white h-12 px-8 font-bold shadow-xl"
                    disabled={isProcessing}
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Empezar con Growth 50€/mes
                  </Button>
                </div>
                <p className="text-xs text-blue-200 mt-4">
                  Sin permanencia • Cancela cuando quieras • Factura deducible
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}