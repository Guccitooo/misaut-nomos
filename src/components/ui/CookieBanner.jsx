import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya aceptó las cookies
    const cookiesAccepted = localStorage.getItem('cookies_accepted');
    if (!cookiesAccepted) {
      // Mostrar banner después de 1 segundo (para no ser intrusivo)
      setTimeout(() => {
        setShowBanner(true);
      }, 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookies_accepted', 'true');
    localStorage.setItem('cookies_accepted_date', new Date().toISOString());
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookies_accepted', 'false');
    localStorage.setItem('cookies_accepted_date', new Date().toISOString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Cookie className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                🍪 Usamos cookies para mejorar tu experiencia
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Utilizamos cookies propias y de terceros para analizar el tráfico, mejorar nuestros servicios 
                y mostrarte publicidad relevante. Al hacer clic en <strong>"Aceptar todas"</strong>, aceptas 
                el uso de todas las cookies. Puedes gestionar tus preferencias en nuestra{" "}
                <a href="#cookies" className="text-blue-600 hover:text-blue-700 font-medium underline">
                  Política de Cookies
                </a>.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={handleReject}
                className="whitespace-nowrap hover:bg-gray-100"
              >
                Solo necesarias
              </Button>
              <Button
                onClick={handleAccept}
                className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white"
              >
                Aceptar todas
              </Button>
            </div>

            {/* Close button */}
            <button
              onClick={handleReject}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors md:hidden"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}