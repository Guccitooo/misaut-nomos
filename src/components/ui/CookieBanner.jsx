import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from './LanguageSwitcher';

export default function CookieBanner() {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setTimeout(() => setShowBanner(true), 2000);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie_consent', 'all');
    setShowBanner(false);
  };

  const handleNecessaryOnly = () => {
    localStorage.setItem('cookie_consent', 'necessary');
    setShowBanner(false);
  };

  const handleClose = () => {
    localStorage.setItem('cookie_consent', 'dismissed');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* ✅ Overlay oscuro detrás */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
        onClick={handleClose}
      />
      
      {/* ✅ Banner de cookies - 100% OPACO */}
      <div className="fixed bottom-0 left-0 right-0 z-[70] p-4 animate-in slide-in-from-bottom duration-500">
        <Card className="max-w-4xl mx-auto border-2 border-blue-600 shadow-2xl bg-white">
          <div className="p-6 relative">
            {/* ✅ Botón cerrar */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar banner de cookies"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-start gap-4 pr-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Cookie className="w-7 h-7 text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900 mb-3">
                  {t('cookieTitle')}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  {t('cookieText')}{" "}
                  <strong className="text-gray-900">"{t('acceptAll')}"</strong>{" "}
                  {t('cookieAccept')}{" "}
                  <Link 
                    to={createPageUrl("CookiePolicy")} 
                    className="text-blue-600 hover:text-blue-800 underline font-semibold"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Política de Cookies
                  </Link>.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleAcceptAll}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
                    size="lg"
                  >
                    <Cookie className="w-4 h-4 mr-2" />
                    {t('acceptAll')}
                  </Button>
                  <Button
                    onClick={handleNecessaryOnly}
                    variant="outline"
                    className="border-2 border-gray-300 hover:bg-gray-50"
                    size="lg"
                  >
                    {t('onlyNecessary')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}