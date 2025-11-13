import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Cookie } from 'lucide-react';
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

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
      <Card className="max-w-4xl mx-auto border-0 shadow-2xl pointer-events-auto">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Cookie className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                {t('cookieTitle')}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('cookieText')}{" "}
                <strong>"{t('acceptAll')}"</strong>{" "}
                {t('cookieAccept')}{" "}
                <Link 
                  to={createPageUrl("CookiePolicy")} 
                  className="text-blue-600 hover:text-blue-800 underline font-semibold"
                >
                  Política de Cookies
                </Link>.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAcceptAll}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {t('acceptAll')}
                </Button>
                <Button
                  onClick={handleNecessaryOnly}
                  variant="outline"
                >
                  {t('onlyNecessary')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}