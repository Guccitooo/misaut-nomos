import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Zap, Droplets, Hammer, Paintbrush, Trees, Sparkles, Wrench, Search,
} from "lucide-react";

const CATEGORIES = [
  { name: "Electricista", icon: Zap, gradient: "from-amber-400 to-yellow-500", soft: "bg-amber-50" },
  { name: "Fontanero", icon: Droplets, gradient: "from-blue-400 to-cyan-500", soft: "bg-blue-50" },
  { name: "Carpintero", icon: Hammer, gradient: "from-orange-400 to-red-500", soft: "bg-orange-50" },
  { name: "Pintor", icon: Paintbrush, gradient: "from-pink-400 to-rose-500", soft: "bg-pink-50" },
  { name: "Jardinero", icon: Trees, gradient: "from-green-400 to-emerald-500", soft: "bg-green-50" },
  { name: "Autónomo de limpieza", label: "Limpieza", icon: Sparkles, gradient: "from-purple-400 to-indigo-500", soft: "bg-purple-50" },
  { name: "Albañil / Reformas", label: "Reformas", icon: Wrench, gradient: "from-slate-400 to-gray-600", soft: "bg-slate-50" },
  { name: "Ver todos", icon: Search, gradient: "from-blue-600 to-indigo-600", soft: "bg-blue-50", featured: true },
];

export default function CategoriesGrid() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-12">
          <Badge className="mb-3 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-0 font-semibold">
            Servicios más buscados
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            ¿Qué necesitas hoy?
          </h2>
          <p className="text-gray-600 mt-3 text-lg">
            Toca una categoría para encontrar profesionales cerca de ti
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  navigate(
                    cat.name === "Ver todos"
                      ? createPageUrl("Search")
                      : createPageUrl("Search") + `?category=${encodeURIComponent(cat.name)}`
                  )
                }
                className={`group relative overflow-hidden rounded-2xl p-5 md:p-6 ${cat.soft} border border-gray-100 hover:border-transparent hover:shadow-xl transition-all text-left min-h-[120px] md:min-h-[140px] flex flex-col justify-between`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative z-10">
                  <div className={`inline-flex w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${cat.gradient} items-center justify-center shadow-md mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <p className="font-bold text-sm md:text-base text-gray-900 group-hover:text-white transition-colors">
                    {cat.label || cat.name}
                  </p>
                </div>
                <div className="relative z-10 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-white text-xs font-semibold mt-2">
                  Explorar →
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}