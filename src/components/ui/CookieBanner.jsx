import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Cookie, Settings, X, Shield, BarChart, Megaphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "./LanguageSwitcher";

const CONSENT_KEY = 'misautonomos_cookie_consent';
const CONSENT_VERSION = '1.0';
const CONSENT_EXPIRY_MONTHS = 6;

export default function CookieBanner() {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    
    if (!consent) {
      setShowBanner(true);
      return;
    }

    try {
      const parsed = JSON.parse(consent);
      const consentDate = new Date(parsed.date);
      const now = new Date();
      const monthsDiff = (now.getFullYear() - consentDate.getFullYear()) * 12 + 
                         (now.getMonth() - consentDate.getMonth());

      if (monthsDiff >= CONSENT_EXPIRY_MONTHS || parsed.version !== CONSENT_VERSION) {
        setShowBanner(true);
      } else {
        setPreferences(parsed.preferences);
        applyConsent(parsed.preferences);
      }
    } catch (error) {
      setShowBanner(true);
    }
  }, []);

  const applyConsent = (prefs) => {
    if (prefs.analytics && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }

    if (prefs.marketing) {
      // Marketing cookies logic here if needed
    }
  };

  const saveConsent = (prefs) => {
    const consent = {
      version: CONSENT_VERSION,
      date: new Date().toISOString(),
      preferences: prefs
    };
    
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    applyConsent(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    setPreferences(necessaryOnly);
    saveConsent(necessaryOnly);
  };

  const handleRejectAll = () => {
    const rejected = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    setPreferences(rejected);
    saveConsent(rejected);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay que bloquea interacción */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        style={{ pointerEvents: 'all' }}
        aria-hidden="true"
      />

      {/* Banner de cookies */}
      <div className="fixed inset-x-0 bottom-0 z-[9999] p-4 pointer-events-none">
        <Card className="max-w-4xl mx-auto border-0 shadow-2xl pointer-events-auto bg-white">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-blue-700" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  {t('cookieBannerTitle')}
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  {t('cookieBannerDescription')}
                </p>
                
                <div className="flex flex-wrap gap-2 text-xs">
                  <Link 
                    to={createPageUrl("CookiePolicy")} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('cookiePolicy')}
                  </Link>
                  <span className="text-gray-400">•</span>
                  <Link 
                    to={createPageUrl("PrivacyPolicy")} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('privacyPolicy')}
                  </Link>
                  <span className="text-gray-400">•</span>
                  <Link 
                    to={createPageUrl("LegalNotice")} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('legalNotice')}
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAcceptAll}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11"
              >
                {t('acceptAllCookies')}
              </Button>
              
              <Button
                onClick={handleAcceptNecessary}
                variant="outline"
                className="flex-1 border-2 border-gray-300 hover:bg-gray-50 font-semibold h-11"
              >
                {t('acceptNecessaryCookies')}
              </Button>
              
              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                className="flex-1 sm:flex-initial border-2 border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold h-11"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t('configureCookies')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de configuración */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Settings className="w-6 h-6 text-blue-700" />
              {t('cookieSettingsTitle')}
            </DialogTitle>
            <DialogDescription className="text-base">
              {t('cookieSettingsDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Cookies Necesarias */}
            <div className="border-2 border-blue-200 rounded-lg p-5 bg-blue-50">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-700 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {t('necessaryCookies')}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">
                      {t('necessaryCookiesDescription')}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Switch checked={true} disabled className="opacity-50" />
                </div>
              </div>
              <p className="text-xs text-blue-800 bg-blue-100 px-3 py-2 rounded">
                <strong>{t('alwaysActive')}</strong> - {t('necessaryCookiesRequired')}
              </p>
            </div>

            {/* Cookies Analíticas */}
            <div className="border-2 border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <BarChart className="w-5 h-5 text-gray-700 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {t('analyticsCookies')}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">
                      {t('analyticsCookiesDescription')}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, analytics: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Cookies Publicitarias */}
            <div className="border-2 border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <Megaphone className="w-5 h-5 text-gray-700 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {t('marketingCookies')}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">
                      {t('marketingCookiesDescription')}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, marketing: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleRejectAll}
              variant="outline"
              className="flex-1 border-2 border-red-300 text-red-700 hover:bg-red-50"
            >
              {t('rejectAllCookies')}
            </Button>
            <Button
              onClick={handleSavePreferences}
              variant="outline"
              className="flex-1 border-2 border-gray-300 hover:bg-gray-50"
            >
              {t('savePreferences')}
            </Button>
            <Button
              onClick={handleAcceptAll}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {t('acceptAllCookies')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}