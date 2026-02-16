import React, { useState, useEffect } from 'react';

/**
 * Componente que difiere la renderización de sus hijos
 * Útil para componentes no críticos que pueden cargarse después
 */
export default function DeferredComponent({ children, delay = 100, fallback = null }) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) return fallback;
  return <>{children}</>;
}