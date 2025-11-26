import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  // useLayoutEffect se ejecuta ANTES del repintado del navegador
  useLayoutEffect(() => {
    // Scroll inmediato sin animación
    window.scrollTo(0, 0);
    
    // También hacer scroll en el contenedor principal si existe
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
    
    // Y en el contenedor principal de la app
    const scrollContainer = document.getElementById('app-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [pathname, search]);

  // Backup con useEffect por si acaso
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}