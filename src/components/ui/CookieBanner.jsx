import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";
import { useLanguage } from "./LanguageSwitcher";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CookieBanner() {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const cookiesAccepted = localStorage.getItem('cookies_accepted');
    if (!cookiesAccepted) {
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
    <>
      <style>
        {`
          @keyframes slideUpCookie {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .cookie-banner-compact {
            animation: slideUpCookie 0.3s ease;
          }

          @media (max-width: 768px) {
            .cookie-banner-compact {
              max-width: 95% !important;
              bottom: 10px !important;
              left: 2.5% !important;
              right: 2.5% !important;
              padding: 12px 14px !important;
            }

            .cookie-banner-buttons {
              flex-direction: column !important;
              gap: 6px !important;
            }

            .cookie-banner-buttons button {
              width: 100% !important;
            }
          }
        `}
      </style>
      
      <div 
        className="cookie-banner-compact fixed bottom-5 left-5 right-5 mx-auto max-w-[420px] bg-white border border-gray-300 rounded-xl shadow-lg p-4 z-[9999]"
      >
        {/* Close button */}
        <button
          onClick={handleReject}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + Content */}
        <div className="flex items-start gap-3 mb-3">
          <Cookie className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 pr-4">
            <p className="text-[13px] leading-relaxed text-gray-700">
              🍪 <strong>{t('cookieTitle')}</strong>
            </p>
            <p className="text-[12px] leading-relaxed text-gray-600 mt-1">
              {t('cookieText')}{" "}
              <Link 
                to={createPageUrl("CookiePolicy")} 
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                {t('cookiePolicy')}
              </Link>.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="cookie-banner-buttons flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReject}
            className="text-[12px] h-8 px-3 hover:bg-gray-100 text-gray-700"
          >
            {t('onlyNecessary')}
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="text-[12px] h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {t('acceptAll')}
          </Button>
        </div>
      </div>
    </>
  );
}