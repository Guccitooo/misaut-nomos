import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star, Users, MapPin, Zap, Droplets, Hammer, Paintbrush,
  Trees, Sparkles, Wrench, CheckCircle, ArrowRight, ChevronDown,
  TrendingUp, Shield, Clock, Briefcase, MessageCircle, Search
} from "lucide-react";

const STATS = [
  { icon: Users, value: "2.400+", label: "Autónomos activos", color: "text-blue-600" },
  { icon: Star, value: "4.8", label: "Valoración media", color: "text-amber-500" },
  { icon: MapPin, value: "48", label: "Provincias cubiertas", color: "text-green-600" },
  { icon: TrendingUp, value: "12.000+", label: "Clientes conectados", color: "text-purple-600" },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: Briefcase,
    title: "Crea tu perfil",
    desc: "Regístrate en menos de 5 minutos. Añade tus servicios, fotos y zona de trabajo.",
    color: "bg-blue-100 text-blue-700",
  },
  {
    step: "2",
    icon: Users,
    title: "Clientes te encuentran",
    desc: "Tu perfil aparece en búsquedas de clientes de tu zona que necesitan tu servicio.",
    color: "bg-green-100 text-green-700",
  },
  {
    step: "3",
    icon: MessageCircle,
    title: "Conecta y trabaja",
    desc: "Recibe solicitudes directamente por chat, teléfono o WhatsApp sin intermediarios.",
    color: "bg-amber-100 text-amber-700",
  },
];

const CATEGORIES = [
  { name: "Electricista", icon: Zap, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { name: "Fontanero", icon: Droplets, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "Carpintero", icon: Hammer, color: "bg-orange-50 text-orange-700 border-orange-200" },
  { name: "Pintor", icon: Paintbrush, color: "bg-pink-50 text-pink-700 border-pink-200" },
  { name: "Jardinero", icon: Trees, color: "bg-green-50 text-green-700 border-green-200" },
  { name: "Limpieza", icon: Sparkles, color: "bg-purple-50 text-purple-700 border-purple-200" },
  { name: "Reformas", icon: Wrench, color: "bg-gray-50 text-gray-700 border-gray-200" },
  { name: "Ver todos", icon: Search, color: "bg-blue-600 text-white border-blue-600" },
];

const TESTIMONIALS = [
  {
    name: "Carlos Pérez",
    role: "Electricista · Madrid",
    text: "En el primer mes conseguí 4 clientes nuevos. La inversión se amortiza sola.",
    rating: 5,
    avatar: "C",
    color: "bg-blue-600",
  },
  {
    name: "Ana García",
    role: "Pintora · Barcelona",
    text: "Lo que más me gusta es el chat directo. Sin intermediarios, sin comisiones.",
    rating: 5,
    avatar: "A",
    color: "bg-green-600",
  },
  {
    name: "Miguel Torres",
    role: "Fontanero · Valencia",
    text: "Llevo 8 meses y tengo lista de espera. Recomiendo MisAutónomos sin dudarlo.",
    rating: 5,
    avatar: "M",
    color: "bg-purple-600",
  },
];

const FAQS = [
  {
    q: "¿Cuánto cuesta para los autónomos?",
    a: "Los primeros 60 días son completamente gratis. Después, el plan mensual cuesta 29€/mes. Sin permanencia, cancela cuando quieras.",
  },
  {
    q: "¿Los clientes pagan algo?",
    a: "No. Los clientes usan MisAutónomos totalmente gratis. Esto atrae más clientes a la plataforma y más trabajo para ti.",
  },
  {
    q: "¿Cuándo empieza a funcionar mi perfil?",
    a: "En menos de 10 minutos. Una vez completes tu perfil, apareces en los resultados de búsqueda de tu zona.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = React.useState(null);

  return (
    <div className="bg-white">
      {/* ===== HERO ===== */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-green-400 rounded-full opacity-15 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
          <Badge className="mb-6 bg-green-500 text-white border-0 px-4 py-1.5 text-sm font-semibold">
            🎁 60 días gratis — Sin compromiso
          </Badge>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Consigue clientes siendo<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              autónomo en España
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            La plataforma donde miles de clientes buscan fontaneros, electricistas, pintores y más profesionales cada día.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => navigate(createPageUrl("PricingPlans"))}
              className="bg-green-500 hover:bg-green-400 text-white h-14 px-10 text-lg font-bold shadow-2xl rounded-xl transition-all hover:scale-105"
            >
              <Briefcase className="w-5 h-5 mr-2" />
              Empezar gratis 60 días
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("Search"))}
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10 h-14 px-10 text-lg font-semibold rounded-xl"
            >
              <Search className="w-5 h-5 mr-2" />
              Buscar profesionales
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color === "text-amber-500" ? "text-amber-400 fill-amber-400" : "text-white"}`} />
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-blue-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Flecha abajo */}
        <div className="text-center pb-6 animate-bounce">
          <ChevronDown className="w-6 h-6 text-blue-300 mx-auto" />
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="mb-3 bg-blue-100 text-blue-700 border-0">Proceso simple</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Empieza a recibir clientes en 3 pasos</h2>
            <p className="text-gray-600 mt-3 text-lg">Sin configuraciones complicadas ni conocimientos técnicos</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Línea conectora en desktop */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-200 via-green-200 to-amber-200 z-0" style={{ left: '16%', right: '16%' }} />

            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="relative z-10 text-center">
                <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-5 shadow-md`}>
                  <step.icon className="w-9 h-9" />
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-white border-2 border-gray-200 rounded-full text-xs font-bold text-gray-600 flex items-center justify-center">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={() => navigate(createPageUrl("PricingPlans"))}
              className="bg-blue-700 hover:bg-blue-600 text-white h-12 px-8 text-base font-semibold rounded-xl"
            >
              Crear mi perfil gratis <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ===== CATEGORÍAS ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-green-100 text-green-700 border-0">Servicios más buscados</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">¿A qué te dedicas?</h2>
            <p className="text-gray-600 mt-3 text-lg">Hay clientes buscando tu servicio ahora mismo</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => navigate(
                  cat.name === "Ver todos"
                    ? createPageUrl("Search")
                    : createPageUrl("Search") + `?category=${encodeURIComponent(cat.name)}`
                )}
                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 ${cat.color} font-semibold text-sm transition-all hover:scale-105 hover:shadow-md`}
              >
                <cat.icon className="w-7 h-7" />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIOS ===== */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="mb-3 bg-amber-100 text-amber-700 border-0">Lo que dicen nuestros autónomos</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Resultados reales de profesionales reales</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="border-0 shadow-lg rounded-2xl bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-5 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${t.color} text-white flex items-center justify-center font-bold`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== POR QUÉ ELEGIRNOS ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">¿Por qué MisAutónomos?</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Sin comisiones", desc: "Tú y el cliente negociáis directamente. Nosotros no cobramos nada por cada trabajo.", color: "text-blue-600 bg-blue-50" },
              { icon: Clock, title: "Perfil en 10 minutos", desc: "Regístrate, completa tu perfil y empieza a recibir contactos de clientes el mismo día.", color: "text-green-600 bg-green-50" },
              { icon: CheckCircle, title: "Clientes verificados", desc: "Todos los clientes se registran con email real. No hay consultas de bots ni spam.", color: "text-purple-600 bg-purple-50" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-gray-200 text-gray-700 border-0">Preguntas frecuentes</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Resolvemos tus dudas</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <Card
                key={i}
                className="border border-gray-200 shadow-sm rounded-xl overflow-hidden cursor-pointer"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-5">
                    <h3 className="font-semibold text-gray-900 text-base pr-4">{faq.q}</h3>
                    <ChevronDown className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </div>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {faq.a}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="py-24 bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-yellow-300 opacity-10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 text-sm px-4 py-1.5">
            ⏰ Oferta por tiempo limitado
          </Badge>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
            Únete ahora —<br />Los primeros 60 días son gratis
          </h2>
          <p className="text-green-100 text-xl mb-10 max-w-xl mx-auto">
            Sin tarjeta de crédito. Sin permanencia. Cancela cuando quieras.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate(createPageUrl("PricingPlans"))}
              className="bg-white hover:bg-gray-50 text-green-700 h-14 px-10 text-lg font-bold shadow-2xl rounded-xl transition-all hover:scale-105"
            >
              <Briefcase className="w-5 h-5 mr-2" />
              Empezar 60 días gratis
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("Search"))}
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10 h-14 px-8 text-lg font-semibold rounded-xl"
            >
              Ver profesionales →
            </Button>
          </div>
          <p className="mt-6 text-green-200 text-sm">
            Ya somos +2.400 autónomos. ¿Te unes?
          </p>
        </div>
      </section>
    </div>
  );
}