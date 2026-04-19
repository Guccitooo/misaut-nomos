import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Megaphone, Target, BarChart3, Clock, CheckCircle, 
  Sparkles, TrendingUp, Users, Eye, MessageSquare,
  ChevronRight, Zap, Shield, Star
} from "lucide-react";
import SEOHead from "../components/seo/SEOHead";

const HOW_IT_WORKS = [
  {
    icon: Target,
    title: "Configuración única (5 min)",
    desc: "Breve cuestionario sobre tu cliente ideal. Solo se hace una vez."
  },
  {
    icon: Clock,
    title: "Briefing mensual (2 min)",
    desc: "Eliges red social y objetivo cada mes. Deadline día 5."
  },
  {
    icon: Sparkles,
    title: "Creamos y lanzamos",
    desc: "Creatividades profesionales + copy publicitario gestionado por nuestro equipo."
  },
  {
    icon: BarChart3,
    title: "Ves resultados",
    desc: "Métricas en tiempo real: alcance, clics, leads, presupuesto gastado."
  }
];

const COMPARISON = [
  { feature: "Perfil visible en búsquedas", visibility: true, adsplus: true },
  { feature: "Contacto directo (WhatsApp, llamada)", visibility: true, adsplus: true },
  { feature: "Mensajes ilimitados", visibility: true, adsplus: true },
  { feature: "Estadísticas de visitas", visibility: true, adsplus: true },
  { feature: "30€ de presupuesto publicitario REAL", visibility: false, adsplus: true },
  { feature: "Campaña gestionada en redes", visibility: false, adsplus: true },
  { feature: "Creatividades profesionales", visibility: false, adsplus: true },
  { feature: "Copy publicitario optimizado", visibility: false, adsplus: true },
  { feature: "Reporte semanal de resultados", visibility: false, adsplus: true },
  { feature: "Soporte prioritario", visibility: false, adsplus: true },
];

const FAQS = [
  {
    q: "¿Qué incluye exactamente el Plan Ads+?",
    a: "Incluye todo lo del Plan Visibility + 30€ de inversión publicitaria real cada mes + gestión completa de tu campaña (creatividades, copy, segmentación, optimización) + reporte semanal de métricas."
  },
  {
    q: "¿Puedo elegir la red social donde anunciarme?",
    a: "Sí, cada mes eliges UNA red entre Instagram, Facebook, TikTok, LinkedIn o Google Search. El siguiente mes puedes cambiar si quieres."
  },
  {
    q: "¿Qué pasa si no relleno el briefing mensual?",
    a: "Te enviamos recordatorios los días 1, 3 y 5. Si el día 6 no lo has rellenado, duplicamos la configuración del mes anterior para que no pierdas el mes."
  },
  {
    q: "¿Los 30€ son de inversión real o incluyen gestión?",
    a: "Los 30€ se invierten íntegramente en tu campaña (presupuesto publicitario puro). La gestión, creatividades y copy ya están cubiertos por los 33€ del plan."
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí, sin permanencia. Cancelas desde tu panel y tu campaña termina al final del mes en curso."
  },
  {
    q: "¿Cuánto tarda en lanzarse mi campaña?",
    a: "Una vez apruebas el briefing y las creatividades (normalmente 24-48h), tu campaña está en vivo en 24-48h más."
  }
];

export default function PlanAdsPage() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Plan Ads+ — Clientes nuevos cada mes | MisAutónomos"
        description="Campañas publicitarias gestionadas en Instagram, Facebook, TikTok, LinkedIn o Google. 30€ de presupuesto incluido. 33€/mes."
        keywords="publicidad autónomos, campañas instagram, facebook ads, google ads, marketing digital, plan ads"
      />
      
      <div className="min-h-screen bg-white">
        
        {/* HERO */}
        <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white py-16 md:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Megaphone className="w-4 h-4" />
              Campañas gestionadas en redes sociales
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Clientes nuevos cada mes,<br className="hidden md:block" /> sin pensar en marketing
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Gestionamos tu publicidad en Instagram, Facebook, TikTok, LinkedIn o Google. 
              Tú solo apruebas y ves resultados.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 h-14 text-lg"
                onClick={() => navigate("/precios")}
              >
                Empezar prueba de 7 días →
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 font-semibold px-8 h-14 text-lg"
                onClick={() => navigate("/precios")}
              >
                Ver precios
              </Button>
            </div>
            <p className="text-sm text-blue-200 mt-4">
              33€/mes · 30€ de inversión publicitaria incluida · Cancela cuando quieras
            </p>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="py-16 md:py-20 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                Así trabajamos contigo cada mes
              </h2>
              <p className="text-lg text-gray-500">
                Proceso simple y rápido. Solo 2 minutos al mes de tu tiempo.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARATIVA */}
        <section className="py-16 md:py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                Visibility vs Ads+
              </h2>
              <p className="text-lg text-gray-500">
                ¿Qué plan es para ti?
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left py-4 px-4 font-bold text-gray-900">Característica</th>
                    <th className="text-center py-4 px-4 font-bold text-gray-600">Visibility<br/><span className="text-sm font-normal">13€/mes</span></th>
                    <th className="text-center py-4 px-4 font-bold text-blue-700 bg-blue-50 rounded-t-lg">Ads+<br/><span className="text-sm font-normal">33€/mes</span></th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-4 px-4 text-gray-900 font-medium">{row.feature}</td>
                      <td className="text-center py-4 px-4">
                        {row.visibility ? (
                          <CheckCircle className="w-5 h-5 text-green-600 inline" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="text-center py-4 px-4 bg-blue-50/50">
                        {row.adsplus ? (
                          <CheckCircle className="w-5 h-5 text-blue-600 inline" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg p-4 inline-block">
                💡 Visibility te hace aparecer. Ads+ te trae clientes activamente.
              </p>
            </div>
          </div>
        </section>

        {/* PLATAFORMAS */}
        <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Elige la red donde están tus clientes
            </h2>
            <p className="text-lg text-gray-500 mb-10">
              Cada mes puedes elegir una plataforma diferente según tu objetivo.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { name: 'Instagram', desc: '25-45 años, visual', users: '18M en España' },
                { name: 'Facebook', desc: '35-65 años, local', users: '20M en España' },
                { name: 'TikTok', desc: '18-30 años, vídeo', users: '13M en España' },
                { name: 'LinkedIn', desc: 'B2B, profesionales', users: '11M en España' },
                { name: 'Google', desc: 'Intención de compra', users: '35M en España' },
              ].map((platform, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-1">{platform.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{platform.desc}</p>
                  <p className="text-xs font-semibold text-blue-600">{platform.users}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-12">
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <details key={i} className="bg-gray-50 rounded-2xl overflow-hidden group">
                  <summary className="flex items-center justify-between px-6 py-5 cursor-pointer font-semibold text-gray-900 text-sm hover:bg-gray-100 transition-colors">
                    {faq.q}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-6 pb-5 pt-2 text-sm text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Empieza a conseguir clientes nuevos
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              7 días gratis · 30€ de presupuesto incluido · Cancela cuando quieras
            </p>
            <Button 
              size="lg" 
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 h-14 text-lg shadow-xl"
              onClick={() => navigate("/precios")}
            >
              Empezar prueba gratis →
            </Button>
            <p className="text-sm text-blue-200 mt-4">
              Sin tarjeta de crédito requerida
            </p>
          </div>
        </section>

      </div>
    </>
  );
}