import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Cookie, Settings, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "./LanguageSwitcher";

const CONSENT_EXPIRY_MONTHS = 3;
const STORAGE_KEY = 'misautonomos_cookie_consent';

export default function CookieBanner() {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    checkCookieConsent();
  }, []);

  const checkCookieConsent = () => {
    try {
      const consentData = localStorage.getItem(STORAGE_KEY);
      
      if (!consentData) {
        setShowBanner(true);
        return;
      }

      const { timestamp, preferences: savedPreferences } = JSON.parse(consentData);
      const consentDate = new Date(timestamp);
      const now = new Date();
      const monthsElapsed = (now - consentDate) / (1000 * 60 * 60 * 24 * 30);

      if (monthsElapsed >= CONSENT_EXPIRY_MONTHS) {
        setShowBanner(true);
        return;
      }

      setPreferences(savedPreferences);
      applyConsent(savedPreferences);
      setShowBanner(false);
    } catch (error) {
      console.error('Error checking cookie consent:', error);
      setShowBanner(true);
    }
  };

  const saveConsent = (prefs) => {
    const consentData = {
      timestamp: new Date().toISOString(),
      preferences: prefs
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
    applyConsent(prefs);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const applyConsent = (prefs) => {
    if (prefs.analytics && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    } else if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    }

    if (prefs.marketing && window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted'
      });
    } else if (window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true
    };
    saveConsent(allAccepted);
  };

  const handleAcceptEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false
    };
    saveConsent(essentialOnly);
  };

  const handleRejectAll = () => {
    const allRejected = {
      essential: true,
      analytics: false,
      marketing: false
    };
    saveConsent(allRejected);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const handleOpenPreferences = () => {
    setShowPreferences(true);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay que bloquea interacción */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        style={{ pointerEvents: 'auto' }}
        aria-hidden="true"
      />

      {/* Banner de cookies - barra inferior */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom duration-500"
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
      >
        <Card className="rounded-none border-0 border-t-4 border-blue-600 shadow-2xl bg-white">
          <CardContent className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Cookie className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <h2 id="cookie-banner-title" className="text-xl font-bold text-gray-900">
                      {t('cookiesBannerTitle')}
                    </h2>
                  </div>
                  <p id="cookie-banner-description" className="text-gray-700 text-sm leading-relaxed mb-4">
                    {t('cookiesBannerDescription')}
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="text-gray-600">{t('learnMoreCookies')}</span>
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

                <div className="flex flex-col sm:flex-row gap-3 lg:flex-col xl:flex-row">
                  <Button
                    onClick={handleAcceptAll}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 h-11"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('acceptAllCookies')}
                  </Button>
                  <Button
                    onClick={handleAcceptEssential}
                    variant="outline"
                    className="border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 font-semibold px-6 h-11"
                  >
                    {t('acceptEssentialCookies')}
                  </Button>
                  <Button
                    onClick={handleOpenPreferences}
                    variant="ghost"
                    className="text-gray-700 hover:bg-gray-100 font-semibold px-6 h-11"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {t('configureCookies')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de preferencias */}
      <Dialog open={showPreferences} onOpenChange={(open) => {
        if (!open) {
          setShowPreferences(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Settings className="w-6 h-6 text-blue-600" />
              {t('cookiePreferences')}
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              {t('cookiePreferencesDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Cookies esenciales */}
            <div className="border-2 border-gray-200 rounded-lg p-5 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <Label htmlFor="essential" className="text-base font-semibold text-gray-900 cursor-default">
                      {t('essentialCookies')}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('essentialCookiesDescription')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="essential"
                    checked={true}
                    disabled={true}
                    className="pointer-events-none"
                  />
                  <span className="text-xs text-gray-500 font-medium">{t('alwaysActive')}</span>
                </div>
              </div>
            </div>

            {/* Cookies analíticas */}
            <div className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <Label htmlFor="analytics" className="text-base font-semibold text-gray-900 cursor-pointer">
                      {t('analyticsCookies')}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('analyticsCookiesDescription')}
                    </p>
                  </div>
                </div>
                <Switch
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
                />
              </div>
            </div>

            {/* Cookies de marketing */}
            <div className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div>
                    <Label htmlFor="marketing" className="text-base font-semibold text-gray-900 cursor-pointer">
                      {t('marketingCookies')}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('marketingCookiesDescription')}
                    </p>
                  </div>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, marketing: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              onClick={handleRejectAll}
              variant="outline"
              className="w-full sm:w-auto border-2 border-gray-300 hover:bg-gray-50"
            >
              {t('rejectAllCookies')}
            </Button>
            <div className="flex gap-3 flex-1">
              <Button
                onClick={handleSavePreferences}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {t('savePreferences')}
              </Button>
              <Button
                onClick={handleAcceptAll}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {t('acceptAllCookies')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}