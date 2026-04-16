import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Carlos Pérez",
    role: "Electricista",
    location: "Madrid",
    text: "En el primer mes conseguí 4 clientes nuevos. La inversión se amortiza sola. Nunca pensé que sería tan sencillo conseguir trabajo.",
    rating: 5,
    avatar: "C",
    gradient: "from-blue-500 to-cyan-600",
    revenue: "+1.200€",
  },
  {
    name: "Ana García",
    role: "Pintora",
    location: "Barcelona",
    text: "Lo que más me gusta es el chat directo. Sin intermediarios, sin comisiones. Yo me entiendo con el cliente desde el primer momento.",
    rating: 5,
    avatar: "A",
    gradient: "from-emerald-500 to-green-600",
    revenue: "+800€",
  },
  {
    name: "Miguel Torres",
    role: "Fontanero",
    location: "Valencia",
    text: "Llevo 8 meses en la plataforma y tengo lista de espera. Recomiendo MisAutónomos sin dudarlo a cualquier compañero del gremio.",
    rating: 5,
    avatar: "M",
    gradient: "from-purple-500 to-violet-600",
    revenue: "+2.000€",
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);

  const prev = () => setActive((a) => (a === 0 ? TESTIMONIALS.length - 1 : a - 1));
  const next = () => setActive((a) => (a === TESTIMONIALS.length - 1 ? 0 : a + 1));

  const t = TESTIMONIALS[active];

  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <Badge className="mb-3 bg-amber-100 text-amber-700 border-0 font-semibold">
            Testimonios reales
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Resultados reales, profesionales reales
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-5 mb-8 md:hidden">
          {TESTIMONIALS.map((t, i) => (
            <Card key={i} className="border-0 shadow-lg rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-5">
                <Quote className="w-6 h-6 text-gray-200 mb-3" />
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role} · {t.location}</p>
                  </div>
                  <div className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {t.revenue}/mes
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Carrusel solo en desktop */}
        <div className="hidden md:block">
          <div className="relative max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="border-0 shadow-2xl rounded-3xl bg-white overflow-hidden">
                  <CardContent className="p-8 md:p-10">
                    <Quote className="w-10 h-10 text-gray-100 mb-5" />
                    <div className="flex gap-1 mb-4">
                      {[...Array(t.rating)].map((_, j) => (
                        <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 text-xl leading-relaxed mb-8">"{t.text}"</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.gradient} text-white flex items-center justify-center font-bold text-xl shrink-0`}>
                          {t.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{t.name}</p>
                          <p className="text-sm text-gray-500">{t.role} · {t.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-emerald-600">{t.revenue}</div>
                        <div className="text-xs text-gray-500">ingreso extra/mes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`rounded-full transition-all duration-300 ${i === active ? "w-8 h-2 bg-blue-600" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"}`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}