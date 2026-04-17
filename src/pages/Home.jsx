import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Shield, Clock, CheckCircle, ArrowRight, ChevronDown
} from "lucide-react";

import HeroSection from "../components/home/HeroSection";
import CategoriesGrid from "../components/home/CategoriesGrid";
import TestimonialsSection from "../components/home/TestimonialsSection";
import FinalCTASection from "../components/home/FinalCTASection";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Crea tu perfil",
    desc: "Regístrate en menos de 5 minutos. Añade tus servicios, fotos y zona de trabajo.",
    color: "from-blue-500 to-cyan-500",
    soft: "bg-blue-50 text-blue-700",
  },
  {
    step: "02",
    title: "Clientes te encuentran",
    desc: "Tu perfil aparece en búsquedas de clientes de tu zona que necesitan tu servicio.",
    color: "from-emerald-500 to-green-500",
    soft: "bg-emerald-50 text-emerald-700",
  },
  {
    step: "03",
    title: "Conecta y trabaja",
    desc: "Recibe solicitudes directamente por chat, teléfono o WhatsApp sin intermediarios.",
    color: "from-amber-500 to-orange-500",
    soft: "bg-amber-50 text-amber-700",
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

const WHY_US = [
  { icon: Shield, title: "Sin comisiones", desc: "Tú y el cliente negociáis directamente. Nosotros no cobramos nada por cada trabajo.", gradient: "from-blue-500 to-cyan-500" },
  { icon: Clock, title: "Perfil en 10 minutos", desc: "Regístrate, completa tu perfil y empieza a recibir contactos de clientes el mismo día.", gradient: "from-emerald-500 to-green-500" },
  { icon: CheckCircle, title: "Clientes verificados", desc: "Todos los clientes se registran con email real. No hay consultas de bots ni spam.", gradient: "from-purple-500 to-violet-500" },
];

export default function Home() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = React.useState(null);

  return (
    <div className="bg-white" style={{overflowX:'hidden', width:'100%', maxWidth:'100vw'}}>
      <HeroSection />

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-blue-100 text-blue-700 border-0 font-semibold">
              Proceso simple
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Empieza a recibir clientes en 3 pasos
            </h2>
            <p className="text-gray-600 mt-3 text-lg">Sin configuraciones complicadas</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative group"
              >
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow h-full">
                  <div className={`inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform`}>
                    <span className="text-white font-extrabold text-lg">{step.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-4 z-10 text-gray-300">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button
              onClick={() => navigate(createPageUrl("PricingPlans"))}
              className="bg-blue-700 hover:bg-blue-600 text-white h-12 px-8 text-base font-semibold rounded-xl transition-all hover:scale-[1.02]"
            >
              Crear mi perfil gratis <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <CategoriesGrid />

      {/* ===== POR QUÉ NOSOTROS ===== */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              ¿Por qué MisAutónomos?
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 md:gap-8">
            {WHY_US.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.1 }}
                className="group text-center p-6 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-xl transition-all bg-white hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-5 shadow-md group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {/* ===== FAQ ===== */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-gray-100 text-gray-700 border-0 font-semibold">
              Preguntas frecuentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Resolvemos tus dudas
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
              >
                <div
                  className={`rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden ${openFaq === i ? "border-blue-200 bg-blue-50/50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between p-5">
                    <h3 className={`font-semibold text-base pr-4 ${openFaq === i ? "text-blue-900" : "text-gray-900"}`}>
                      {faq.q}
                    </h3>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${openFaq === i ? "bg-blue-600 text-white rotate-180" : "bg-gray-100 text-gray-500"}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                  {openFaq === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-blue-100 pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FinalCTASection />
    </div>
  );
}