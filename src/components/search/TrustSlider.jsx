import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CARDS = [
  { emoji: "🏆", title: "Solo los mejores", text: "Máximo 10 autónomos por ciudad y categoría. Solo los más valorados.", bg: "#1e3a8a" },
  { emoji: "📣", title: "Les promocionamos", text: "Invertimos en publicidad en redes sociales para que lleguen a más clientes. Sin coste.", bg: "#7c3aed" },
  { emoji: "⭐", title: "Reseñas verificadas", text: "Solo clientes reales que han contactado al profesional pueden opinar.", bg: "#d97706" },
  { emoji: "🚫", title: "Tolerancia cero", text: "3 reseñas negativas verificadas y el autónomo es expulsado automáticamente.", bg: "#dc2626" },
  { emoji: "🔒", title: "Sin compromisos", text: "Registrarse es gratis. Sin tarjeta, sin letra pequeña.", bg: "#065f46" },
  { emoji: "📋", title: "Perfiles completos", text: "Fotos reales, zona de trabajo, precios y años de experiencia visibles.", bg: "#0e7490" },
];

export default function TrustSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % CARDS.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + CARDS.length) % CARDS.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [next, paused]);

  return (
    <section className="py-10 md:py-14 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8">
          ¿Por qué confiar en nosotros?
        </h2>

        {/* Desktop: 3 columns always visible */}
        <div className="hidden md:grid md:grid-cols-3 gap-5">
          {CARDS.map((card, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col"
              style={{ minHeight: '200px' }}
            >
              <div className="text-4xl mb-3">{card.emoji}</div>
              <div className="font-bold text-gray-900 text-base mb-2">{card.title}</div>
              <div className="text-gray-500 text-sm leading-relaxed">{card.text}</div>
            </div>
          ))}
        </div>

        {/* Mobile: single-card slider */}
        <div
          className="md:hidden relative"
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 flex flex-col items-center text-center"
            style={{ minHeight: '200px' }}
            key={current}
          >
            <div className="text-5xl mb-4">{CARDS[current].emoji}</div>
            <div className="font-bold text-gray-900 text-lg mb-2">{CARDS[current].title}</div>
            <div className="text-gray-500 text-sm leading-relaxed">{CARDS[current].text}</div>
          </div>

          {/* Arrows */}
          <button
            onClick={prev}
            aria-label="Anterior"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-9 h-9 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={next}
            aria-label="Siguiente"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-9 h-9 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-5">
            {CARDS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); setPaused(true); setTimeout(() => setPaused(false), 5000); }}
                aria-label={`Slide ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? '24px' : '8px',
                  height: '8px',
                  background: i === current ? '#2563eb' : '#d1d5db',
                }}
              />
            ))}
          </div>
          <p className="text-center text-gray-400 text-xs mt-2">{current + 1} / {CARDS.length}</p>
        </div>
      </div>
    </section>
  );
}