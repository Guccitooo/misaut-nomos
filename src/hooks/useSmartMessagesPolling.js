import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Hook para polling inteligente de mensajes
export const useSmartMessagesPolling = (queryKey, queryFn, enabled = true) => {
  const location = useLocation();
  const intervalRef = useRef(null);
  const [isMessagesPage, setIsMessagesPage] = useState(false);

  useEffect(() => {
    // Detectar si estamos en la página de mensajes
    setIsMessagesPage(location.pathname === '/mensajes' || location.pathname === '/messages');
  }, [location.pathname]);

  useEffect(() => {
    // Limpiar intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!enabled) return;

    // Detectar si la pestaña está visible
    const handleVisibilityChange = () => {
      if (document.hidden && intervalRef.current) {
        // Pausar polling cuando la pestaña no está activa
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (!document.hidden && isMessagesPage) {
        // Reanudar polling cuando la pestaña está activa
        startPolling();
      }
    };

    const startPolling = () => {
      // Usar 10s en página de mensajes, 30s en otras páginas
      const interval = isMessagesPage ? 10000 : 30000;
      
      // Solo hacer polling en la página de mensajes
      if (isMessagesPage) {
        intervalRef.current = setInterval(() => {
          queryFn();
        }, interval);
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isMessagesPage, queryFn]);
};