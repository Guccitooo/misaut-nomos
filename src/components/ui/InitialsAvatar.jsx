import React from "react";

// Genera un color de fondo determinístico a partir de un string
function getColorFromString(str = "") {
  const COLORS = [
    ["#1D4ED8", "#DBEAFE"], // blue
    ["#7C3AED", "#EDE9FE"], // violet
    ["#065F46", "#D1FAE5"], // green
    ["#92400E", "#FEF3C7"], // amber
    ["#9D174D", "#FCE7F3"], // pink
    ["#0E7490", "#CFFAFE"], // cyan
    ["#B45309", "#FEF9C3"], // yellow
    ["#1E40AF", "#E0E7FF"], // indigo
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

/**
 * Avatar con iniciales derivadas del nombre, sobre fondo de color determinístico.
 * Si `src` está disponible, muestra la imagen; si no, las iniciales.
 */
export default function InitialsAvatar({ name = "", src, className = "", size = 48 }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "?";

  const [textColor, bgColor] = getColorFromString(name);
  const fontSize = size <= 32 ? "10px" : size <= 48 ? "14px" : "18px";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`object-cover object-center rounded-full ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        onError={(e) => {
          // Si la imagen falla, ocultar y mostrar fallback
          e.target.style.display = "none";
          e.target.nextSibling && (e.target.nextSibling.style.display = "flex");
        }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold select-none flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        backgroundColor: bgColor,
        color: textColor,
        fontSize,
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}