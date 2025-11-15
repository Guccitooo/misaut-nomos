import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "all");
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "necessary");
    setShowBanner(false);
  };

  const handleClose = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={handleClose} />
      <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-[101] shadow-2xl border-2 border-blue-200 bg-white">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Cookie className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Cookies en MisAutónomos</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
            Usamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar contenido. 
            Al aceptar, nos ayudas a mejorar MisAutónomos.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <Button 
              onClick={handleAccept}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              Aceptar todas
            </Button>
            <Button 
              onClick={handleReject}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50"
            >
              Solo necesarias
            </Button>
          </div>
          
          <Link 
            to={createPageUrl("CookiePolicy")} 
            className="text-xs text-blue-600 hover:text-blue-800 underline block text-center"
          >
            Ver política de cookies completa
          </Link>
        </div>
      </Card>
    </>
  );
}