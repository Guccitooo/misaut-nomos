import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react";

function computeChecklist(profile) {
  if (!profile) return [];
  return [
    { key: "basic", label: "Información básica", done: !!(profile.business_name && profile.descripcion_corta) },
    { key: "photo", label: "Foto de perfil", done: !!profile.imagen_principal },
    { key: "categories", label: "Categorías de servicio", done: Array.isArray(profile.categories) && profile.categories.length > 0 },
    { key: "location", label: "Zona de trabajo", done: !!(profile.provincia && profile.ciudad) },
    { key: "description", label: "Descripción detallada", done: !!(profile.description && profile.description.length > 80) },
    { key: "gallery", label: "Fotos de trabajos", done: Array.isArray(profile.photos) && profile.photos.length >= 3 },
    { key: "services", label: "Servicios ofrecidos", done: Array.isArray(profile.services_offered) && profile.services_offered.length > 0 },
    { key: "contact", label: "Métodos de contacto", done: Array.isArray(profile.metodos_contacto) && profile.metodos_contacto.length > 0 },
  ];
}

export default function ProfileCompletionCard({ profile }) {
  const navigate = useNavigate();
  const checklist = computeChecklist(profile);
  const done = checklist.filter((c) => c.done).length;
  const total = checklist.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const nextSteps = checklist.filter((c) => !c.done).slice(0, 3);

  const status =
    pct === 100
      ? { label: "¡Perfil completo!", color: "from-emerald-500 to-green-500", text: "text-emerald-700" }
      : pct >= 70
      ? { label: "Casi listo", color: "from-blue-500 to-cyan-500", text: "text-blue-700" }
      : pct >= 40
      ? { label: "En progreso", color: "from-amber-500 to-orange-500", text: "text-amber-700" }
      : { label: "Empezando", color: "from-rose-500 to-pink-500", text: "text-rose-700" };

  return (
    <Card className="relative overflow-hidden border-0 shadow-sm rounded-2xl bg-gradient-to-br from-white via-white to-blue-50/40">
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl pointer-events-none" />
      <CardContent className="relative p-5 md:p-6">
        <div className="flex items-start justify-between mb-5 gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className={`w-4 h-4 ${status.text}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${status.text}`}>
                {status.label}
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900">Completitud del perfil</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Un perfil completo recibe hasta 5× más contactos
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl md:text-4xl font-extrabold text-gray-900 tabular-nums">
              {pct}<span className="text-lg text-gray-400">%</span>
            </div>
            <div className="text-xs text-gray-500 font-medium">{done}/{total} pasos</div>
          </div>
        </div>

        {/* Barra de progreso animada */}
        <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden mb-5">
          <motion.div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${status.color} rounded-full shadow-sm`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
          {pct > 0 && pct < 100 && (
            <motion.div
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              style={{ left: 0 }}
            />
          )}
        </div>

        {pct < 100 && nextSteps.length > 0 && (
          <div className="space-y-2 mb-5">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Siguientes pasos
            </p>
            {nextSteps.map((step) => (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2.5 text-sm text-gray-700 py-1"
              >
                <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <span>{step.label}</span>
              </motion.div>
            ))}
          </div>
        )}

        {pct === 100 && (
          <div className="flex items-center gap-2 mb-5 text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">Tu perfil está optimizado para recibir más clientes</span>
          </div>
        )}

        <Button
          onClick={() => navigate(createPageUrl("MyProfile"))}
          className={`w-full h-11 bg-gradient-to-r ${status.color} hover:opacity-95 text-white font-semibold rounded-xl shadow-sm group`}
        >
          {pct === 100 ? "Editar perfil" : "Completar ahora"}
          <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}