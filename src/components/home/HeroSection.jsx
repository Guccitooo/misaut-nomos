import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search, Briefcase, Star, Users, MapPin, TrendingUp, Sparkles, Clock } from "lucide-react";

const STATS = [
  { icon: Users, value: "2.400+", label: "Autónomos", accent: "from-blue-400 to-cyan-300" },
  { icon: Star, value: "4.8", label: "Valoración", accent: "from-amber-400 to-yellow-300" },
  { icon: MapPin, value: "48", label: "Provincias", accent: "from-emerald-400 to-green-300" },
  { icon: TrendingUp, value: "12K+", label: "Clientes", accent: "from-purple-400 to-pink-300" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section style={{overflow:'hidden', width:'100%', maxWidth:'100vw', position:'relative'}} className="bg-gradient-to-br from-[#0a1a3a] via-[#112763] to-[#1e3a8a] text-white">
      {/* Orbes de color animados — contenidos estrictamente */}
      <div style={{position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none'}}>
        <motion.div
          className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/20 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-emerald-400/25 to-green-500/15 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
      </div>

      <div className="relative w-full max-w-6xl mx-auto px-4 pt-14 md:pt-24 pb-20 md:pb-28" style={{boxSizing:'border-box'}}>
        {/* Badge top */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex justify-center mb-6"
        >
          <Badge className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 text-xs font-semibold rounded-full max-w-full text-center">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300 flex-shrink-0" />
            7 días gratis · Sin tarjeta · Sin permanencia
          </Badge>
        </motion.div>

        {/* Headline principal */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-center font-extrabold leading-tight tracking-tight mb-6 w-full"
          style={{fontSize:'clamp(1.75rem, 8vw, 4.5rem)', wordBreak:'break-word', overflowWrap:'break-word'}}
        >
          Encuentra al{" "}
          <span className="relative inline-block" style={{maxWidth:'100%'}}>
            <span className="relative z-10 bg-gradient-to-r from-cyan-300 via-blue-200 to-emerald-300 bg-clip-text text-transparent">
              autónomo perfecto
            </span>
            <motion.span
              className="absolute left-0 -bottom-1 h-[5px] w-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-300 rounded-full origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
            />
          </span>
          <br />
          en tu zona en{" "}
          <span className="text-amber-300">&lt; 2 minutos</span>
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-center text-blue-100/90 mx-auto mb-10 leading-relaxed w-full"
          style={{fontSize:'clamp(0.95rem, 3vw, 1.25rem)', maxWidth:'min(100%, 42rem)'}}
        >
          La plataforma donde miles de clientes conectan cada día con fontaneros, electricistas, pintores y más profesionales verificados.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch mb-10 w-full"
          style={{maxWidth:'min(100%, 42rem)', margin:'0 auto 2.5rem'}}
        >
          <Button
            onClick={() => navigate(createPageUrl("Search"))}
            className="group flex-1 h-14 bg-white text-blue-900 hover:bg-blue-50 font-bold text-base rounded-2xl shadow-[0_10px_40px_-10px_rgba(255,255,255,0.4)] transition-all"
          >
            <Search className="w-5 h-5 mr-2" />
            Buscar profesional
          </Button>
          <Button
            onClick={() => navigate(createPageUrl("Search"))}
            className="group flex-1 h-14 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-bold text-base rounded-2xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.6)] transition-all"
          >
            <Search className="w-5 h-5 mr-2" />
            Buscar autónomo
          </Button>
        </motion.div>

        {/* Trust row */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-wrap items-center justify-center gap-2 text-xs text-blue-200/80 mb-12"
        >
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Registro en menos de 3 min</span>
          <span>·</span>
          <span>Verificación manual</span>
          <span>·</span>
          <span>Sin comisiones</span>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-4xl mx-auto"
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden group rounded-2xl bg-white/[0.07] backdrop-blur-md border border-white/10 p-4 md:p-5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${s.accent} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <div className="relative">
                <div className={`inline-flex w-10 h-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.accent} bg-opacity-20 mb-2`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-extrabold tracking-tight">{s.value}</div>
                <div className="text-[11px] md:text-xs text-blue-200/80 mt-0.5 font-medium">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Wave divider */}
      <div className="relative">
        <svg
          className="w-full h-12 md:h-16"
          viewBox="0 0 1440 74"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 40L60 36C120 32 240 24 360 26C480 28 600 40 720 44C840 48 960 44 1080 38C1200 32 1320 24 1380 20L1440 16V74H0V40Z"
            fill="rgb(249 250 251)"
          />
        </svg>
      </div>
    </section>
  );
}