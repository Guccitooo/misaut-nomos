import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Wrapper que fuerza tema claro en todas las rutas /admin/*
 * Aplica la clase 'admin-light-theme' al documento para override de tema oscuro
 */
export default function AdminThemeWrapper({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdminRoute) {
      document.documentElement.classList.add('admin-light-theme');
      return () => {
        document.documentElement.classList.remove('admin-light-theme');
      };
    }
  }, [isAdminRoute]);

  return <>{children}</>;
}