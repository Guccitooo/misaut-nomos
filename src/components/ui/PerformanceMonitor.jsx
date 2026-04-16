import { useEffect } from 'react';

export default function PerformanceMonitor() {
  useEffect(() => {
    // Solo en desarrollo o si está habilitado
    if (import.meta.env.MODE !== 'production') {
      // Monitorear Web Vitals
      if ('web-vital' in window) {
        const reportWebVital = (metric) => {
          console.log(`[Performance] ${metric.name}:`, metric.value);
          
          // Alertar si las métricas están mal
          if (metric.name === 'LCP' && metric.value > 2500) {
            console.warn('⚠️ LCP (Largest Contentful Paint) es muy alto:', metric.value);
          }
          if (metric.name === 'FID' && metric.value > 100) {
            console.warn('⚠️ FID (First Input Delay) es muy alto:', metric.value);
          }
          if (metric.name === 'CLS' && metric.value > 0.1) {
            console.warn('⚠️ CLS (Cumulative Layout Shift) es muy alto:', metric.value);
          }
        };

        // Registrar métricas cuando estén disponibles
        try {
          import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
            getCLS(reportWebVital);
            getFID(reportWebVital);
            getFCP(reportWebVital);
            getLCP(reportWebVital);
            getTTFB(reportWebVital);
          });
        } catch (error) {
          console.log('Web Vitals no disponible');
        }
      }

      // Monitorear tiempos de carga
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          console.log('[Performance] Tiempos de carga:', {
            'DNS': perfData.domainLookupEnd - perfData.domainLookupStart,
            'TCP': perfData.connectEnd - perfData.connectStart,
            'Request': perfData.responseStart - perfData.requestStart,
            'Response': perfData.responseEnd - perfData.responseStart,
            'DOM Processing': perfData.domInteractive - perfData.responseEnd,
            'DOM Content Loaded': perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            'Total': perfData.loadEventEnd - perfData.fetchStart
          });
        }
      });
    }
  }, []);

  return null;
}