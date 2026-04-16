import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Transición nativa-like: fade suave entre páginas
export default function PageTransitions({ children }) {
  const location = useLocation();
  const containerRef = useRef(null);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (prevPathRef.current === location.pathname) return;

    prevPathRef.current = location.pathname;

    // Scroll al top en cada navegación
    window.scrollTo({ top: 0, behavior: "instant" });

    // Fade in
    el.style.opacity = "0";
    el.style.transition = "none";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "opacity 220ms ease";
        el.style.opacity = "1";
      });
    });
  }, [location.pathname]);

  return (
    <div ref={containerRef} style={{ opacity: 1, willChange: "opacity" }}>
      {children}
    </div>
  );
}