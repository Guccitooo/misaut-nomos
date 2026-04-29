import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useScrollRestore } from "@/hooks/useScrollRestore";

// Transición nativa-like: fade suave entre páginas
// Reserva min-height durante la transición para evitar que el footer
// suba al top antes de que cargue el contenido de la página.
export default function PageTransitions({ children }) {
  const location = useLocation();
  const containerRef = useRef(null);
  const prevPathRef = useRef(location.pathname);
  const [minHeight, setMinHeight] = useState("100vh");

  // Scroll position preservation across bottom-nav tabs
  useScrollRestore();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (prevPathRef.current === location.pathname) return;

    prevPathRef.current = location.pathname;

    // Reservar altura actual antes de cambiar para que el footer no suba
    const currentHeight = el.getBoundingClientRect().height;
    setMinHeight(`${Math.max(currentHeight, window.innerHeight)}px`);

    // Fade out instantáneo → fade in suave
    el.style.opacity = "0";
    el.style.transition = "none";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "opacity 200ms ease";
        el.style.opacity = "1";
        // Quitar min-height tras la transición
        setTimeout(() => setMinHeight(""), 250);
      });
    });
  }, [location.pathname]);

  return (
    <div ref={containerRef} style={{ opacity: 1, willChange: "opacity", minHeight }}>
      {children}
    </div>
  );
}