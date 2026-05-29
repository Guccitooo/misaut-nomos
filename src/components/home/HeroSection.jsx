import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronDown, ArrowRight } from "lucide-react";

const CATEGORIES = [
  { emoji: "🔌", label: "Electricista" },
  { emoji: "🔧", label: "Fontanero" },
  { emoji: "🎨", label: "Pintor" },
  { emoji: "🏗️", label: "Albañil/Reformas" },
  { emoji: "🌿", label: "Jardinero" },
  { emoji: "🧹", label: "Limpieza" },
  { emoji: "🔑", label: "Cerrajero" },
  { emoji: "❄️", label: "Climatización" },
  { emoji: "💻", label: "Informático" },
  { emoji: "🪟", label: "Carpintero" },
  { emoji: "🚚", label: "Mudanzas" },
  { emoji: "📸", label: "Fotógrafo" },
  { emoji: "🍽️", label: "Catering" },
  { emoji: "💆", label: "Masajista" },
  { emoji: "⚖️", label: "Abogado" },
  { emoji: "📊", label: "Asesor fiscal" },
  { emoji: "🐾", label: "Mascotas" },
  { emoji: "🚿", label: "Fontanería" },
];

const PROVINCIAS = [
  "Álava","Albacete","Alicante","Almería","Asturias","Ávila","Badajoz","Barcelona",
  "Burgos","Cáceres","Cádiz","Cantabria","Castellón","Ciudad Real","Córdoba",
  "Cuenca","Gerona","Granada","Guadalajara","Guipúzcoa","Huelva","Huesca",
  "Islas Baleares","Jaén","La Coruña","La Rioja","Las Palmas","León","Lérida",
  "Lugo","Madrid","Málaga","Murcia","Navarra","Orense","Palencia","Pontevedra",
  "Salamanca","Santa Cruz de Tenerife","Segovia","Sevilla","Soria","Tarragona",
  "Teruel","Toledo","Valencia","Valladolid","Vizcaya","Zamora","Zaragoza",
];

const STEPS = ["Categoría", "Provincia", "Ver resultados"];

export default function HeroSection() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1, 2, 3
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProvincia, setSelectedProvincia] = useState("");
  const [provinciaOpen, setProvinciaOpen] = useState(false);

  const handleCategorySelect = (label) => {
    setSelectedCategory(label);
    setStep(2);
  };

  const handleProvinciaSelect = (prov) => {
    setSelectedProvincia(prov);
    setProvinciaOpen(false);
    setStep(3);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("categoria", selectedCategory);
    if (selectedProvincia) params.set("provincia", selectedProvincia);
    navigate(`/buscar?${params.toString()}`);
  };

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
      {/* Fondo decorativo */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-80px", left: "-80px", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div style={{ position: "relative", width: "100%", maxWidth: "1152px", margin: "0 auto", padding: "48px 20px 72px", boxSizing: "border-box" }}>

        {/* Badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "999px", padding: "6px 16px", fontSize: "12px", fontWeight: 600 }}>
            <Sparkles style={{ width: "14px", height: "14px", color: "#fbbf24", flexShrink: 0 }} />
            <span>100% gratuito para autónomos · Sin tarjeta · Sin permanencia</span>
          </div>
        </div>

        {/* Headline */}
        <h1 style={{ textAlign: "center", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "12px", fontSize: "clamp(1.7rem, 6vw, 3.5rem)" }}>
          Encuentra al{" "}
          <span style={{ color: "#67e8f9" }}>autónomo perfecto</span>
          <br />
          en tu zona
        </h1>

        <p style={{ textAlign: "center", color: "rgba(219,234,254,0.9)", fontSize: "clamp(0.9rem, 2.2vw, 1.1rem)", lineHeight: 1.6, marginBottom: "36px", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
          Contacta gratis con profesionales verificados en España
        </p>

        {/* STEP INDICATOR */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "28px" }}>
          {STEPS.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <React.Fragment key={label}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: isDone ? "#10b981" : isActive ? "#fbbf24" : "rgba(255,255,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: 700,
                    color: isDone || isActive ? "#000" : "rgba(255,255,255,0.5)",
                    transition: "all 0.3s ease",
                    flexShrink: 0,
                  }}>
                    {isDone ? "✓" : stepNum}
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: isActive ? "#fbbf24" : isDone ? "#10b981" : "rgba(255,255,255,0.4)", display: "none", whiteSpace: "nowrap" }} className="sm-inline">
                    {label}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: isActive ? "#fbbf24" : isDone ? "#10b981" : "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: "24px", height: "2px", background: step > stepNum ? "#10b981" : "rgba(255,255,255,0.2)", transition: "background 0.3s ease", flexShrink: 0 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* FILTER CARD */}
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px", padding: "28px 24px", maxWidth: "760px", margin: "0 auto", backdropFilter: "blur(8px)" }}>

          {/* PASO 1 — Categorías */}
          {step >= 1 && (
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "rgba(191,219,254,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                {step === 1 ? "¿Qué necesitas?" : `✓ ${selectedCategory}`}
              </p>

              {step === 1 && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px",
                }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => handleCategorySelect(cat.label)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 12px",
                        background: selectedCategory === cat.label ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.08)",
                        border: selectedCategory === cat.label ? "2px solid #fbbf24" : "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        color: "white",
                        fontSize: "13px",
                        fontWeight: 500,
                        textAlign: "left",
                        transition: "all 0.15s ease",
                        width: "100%",
                      }}
                      onMouseEnter={e => { if (selectedCategory !== cat.label) { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}}
                      onMouseLeave={e => { if (selectedCategory !== cat.label) { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}}
                    >
                      <span style={{ fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>{cat.emoji}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {step > 1 && (
                <button
                  onClick={() => setStep(1)}
                  style={{ background: "rgba(251,191,36,0.15)", border: "2px solid #fbbf24", borderRadius: "12px", padding: "10px 16px", color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ fontSize: "18px" }}>{CATEGORIES.find(c => c.label === selectedCategory)?.emoji}</span>
                  {selectedCategory}
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginLeft: "4px" }}>cambiar</span>
                </button>
              )}
            </div>
          )}

          {/* Separador */}
          {step >= 2 && (
            <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "20px 0" }} />
          )}

          {/* PASO 2 — Provincia */}
          {step >= 2 && (
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "rgba(191,219,254,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                ¿En qué provincia?
              </p>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setProvinciaOpen(!provinciaOpen)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "white",
                    border: "2px solid " + (selectedProvincia ? "#fbbf24" : "transparent"),
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    fontSize: "15px",
                    fontWeight: selectedProvincia ? 600 : 400,
                    color: selectedProvincia ? "#1e3a8a" : "#6b7280",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <span>{selectedProvincia || "Selecciona una provincia..."}</span>
                  <ChevronDown style={{ width: "18px", height: "18px", color: "#6b7280", transform: provinciaOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }} />
                </button>

                {provinciaOpen && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    right: 0,
                    background: "white",
                    borderRadius: "14px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                    zIndex: 100,
                    maxHeight: "260px",
                    overflowY: "auto",
                    border: "1px solid #e5e7eb",
                  }}>
                    {PROVINCIAS.map((prov) => (
                      <button
                        key={prov}
                        onClick={() => handleProvinciaSelect(prov)}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "11px 16px",
                          background: selectedProvincia === prov ? "#eff6ff" : "transparent",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: "14px",
                          color: selectedProvincia === prov ? "#1d4ed8" : "#374151",
                          fontWeight: selectedProvincia === prov ? 600 : 400,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = selectedProvincia === prov ? "#eff6ff" : "transparent"; }}
                      >
                        {prov}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Separador */}
          {step >= 3 && (
            <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "20px 0" }} />
          )}

          {/* PASO 3 — Botón */}
          {step >= 3 && (
            <button
              onClick={handleSearch}
              style={{
                width: "100%",
                padding: "16px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                border: "none",
                borderRadius: "14px",
                color: "#000",
                fontSize: "17px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: "0 8px 30px rgba(245,158,11,0.5)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(245,158,11,0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(245,158,11,0.5)"; }}
            >
              Ver profesionales
              <ArrowRight style={{ width: "20px", height: "20px" }} />
            </button>
          )}

          {/* Skip link */}
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button
              onClick={() => navigate("/buscar")}
              style={{ background: "none", border: "none", color: "rgba(191,219,254,0.6)", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
            >
              Ver todos los profesionales sin filtrar
            </button>
          </div>
        </div>

        {/* Trust pills */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "12px", color: "rgba(191,219,254,0.8)", marginTop: "28px" }}>
          <span>✓ Contacto directo</span>
          <span>·</span>
          <span>Sin comisiones</span>
          <span>·</span>
          <span>Verificados</span>
        </div>

        {/* Banner autónomos */}
        <div style={{ marginTop: "24px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "14px", padding: "14px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "12px", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
          <span style={{ fontSize: "14px", color: "rgba(167,243,208,0.9)", fontWeight: 500 }}>¿Eres autónomo? Consigue clientes gratis</span>
          <button
            onClick={() => navigate("/completar-perfil")}
            style={{ background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: "10px", padding: "8px 18px", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Registrarme gratis →
          </button>
        </div>
      </div>

      {/* Wave divider */}
      <div style={{ position: "relative", lineHeight: 0 }}>
        <svg style={{ display: "block", width: "100%", height: "48px" }} viewBox="0 0 1440 74" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 40L60 36C120 32 240 24 360 26C480 28 600 40 720 44C840 48 960 44 1080 38C1200 32 1320 24 1380 20L1440 16V74H0V40Z" fill="rgb(249 250 251)" />
        </svg>
      </div>
    </section>
  );
}