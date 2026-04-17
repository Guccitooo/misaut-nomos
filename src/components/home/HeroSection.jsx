import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, Star, Users, MapPin, TrendingUp, Sparkles, Clock } from "lucide-react";

const STATS = [
  { icon: Users, value: "2.400+", label: "Autónomos" },
  { icon: Star, value: "4.8★", label: "Valoración" },
  { icon: MapPin, value: "48", label: "Provincias" },
  { icon: TrendingUp, value: "12K+", label: "Clientes" },
];

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        overflowY: "visible",
        background: "linear-gradient(135deg, #0a1a3a 0%, #112763 50%, #1e3a8a 100%)",
        color: "white",
        boxSizing: "border-box",
      }}
    >
      {/* Fondo decorativo — estrictamente contenido */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-80px", left: "-80px", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1152px",
          margin: "0 auto",
          padding: "56px 20px 80px",
          boxSizing: "border-box",
        }}
      >
        {/* Badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "999px",
            padding: "6px 16px",
            fontSize: "12px",
            fontWeight: 600,
            backdropFilter: "blur(8px)",
            maxWidth: "100%",
            flexWrap: "wrap",
            justifyContent: "center",
            textAlign: "center",
          }}>
            <Sparkles style={{ width: "14px", height: "14px", color: "#fbbf24", flexShrink: 0 }} />
            <span>7 días gratis · Sin tarjeta · Sin permanencia</span>
          </div>
        </div>

        {/* Headline */}
        <h1
          style={{
            textAlign: "center",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "24px",
            fontSize: "clamp(1.8rem, 7.5vw, 4.5rem)",
            width: "100%",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto",
          }}
        >
          Encuentra al{" "}
          <span style={{ color: "#67e8f9" }}>autónomo perfecto</span>
          <br />
          en tu zona en{" "}
          <span style={{ color: "#fbbf24" }}>&lt; 2 minutos</span>
        </h1>

        {/* Párrafo */}
        <p
          style={{
            textAlign: "center",
            color: "rgba(219,234,254,0.9)",
            fontSize: "clamp(0.95rem, 2.5vw, 1.2rem)",
            lineHeight: 1.7,
            marginBottom: "36px",
            maxWidth: "min(600px, 100%)",
            marginLeft: "auto",
            marginRight: "auto",
            width: "100%",
            wordBreak: "break-word",
          }}
        >
          La plataforma donde miles de clientes conectan cada día con fontaneros, electricistas, pintores y más profesionales verificados.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "36px",
            width: "100%",
            maxWidth: "min(500px, 100%)",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <button
            onClick={() => navigate(createPageUrl("Search"))}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              height: "52px",
              background: "white",
              color: "#1e3a8a",
              fontWeight: 700,
              fontSize: "16px",
              borderRadius: "14px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 30px rgba(255,255,255,0.25)",
            }}
          >
            <Search style={{ width: "18px", height: "18px" }} />
            Buscar profesional
          </button>
          <button
            onClick={() => navigate(createPageUrl("PricingPlans"))}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              height: "52px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "white",
              fontWeight: 700,
              fontSize: "16px",
              borderRadius: "14px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 30px rgba(16,185,129,0.4)",
            }}
          >
            <Sparkles style={{ width: "18px", height: "18px" }} />
            Hazte autónomo — 7 días gratis
          </button>
        </div>

        {/* Trust row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "12px",
            color: "rgba(191,219,254,0.8)",
            marginBottom: "44px",
          }}
        >
          <Clock style={{ width: "13px", height: "13px", flexShrink: 0 }} />
          <span>Registro en menos de 3 min</span>
          <span>·</span>
          <span>Verificación manual</span>
          <span>·</span>
          <span>Sin comisiones</span>
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
            width: "100%",
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px",
                padding: "16px",
                backdropFilter: "blur(8px)",
                boxSizing: "border-box",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "2px" }}>
                {s.value}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(191,219,254,0.75)", fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave divider */}
      <div style={{ position: "relative", lineHeight: 0 }}>
        <svg
          style={{ display: "block", width: "100%", height: "48px" }}
          viewBox="0 0 1440 74"
          preserveAspectRatio="none"
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