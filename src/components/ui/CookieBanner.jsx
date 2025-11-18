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
  const [hasConsent, setHasConsent] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    checkCookieConsent();
    
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        checkCookieConsent();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cookie-consent-reopen', () => {
      setShowBanner(true);
      setShowPreferences(false);
      setHasConsent(false);
    });
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (showBanner || showPreferences) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [showBanner, showPreferences]);

  const checkCookieConsent = () => {
    try {
      const consentData = localStorage.getItem(STORAGE_KEY);
      
      if (!consentData) {
        setShowBanner(true);
        setHasConsent(false);
        return;
      }

      const { timestamp, preferences: savedPreferences } = JSON.parse(consentData);
      const consentDate = new Date(timestamp);
      const now = new Date();
      const monthsElapsed = (now - consentDate) / (1000 * 60 * 60 * 24 * 30);

      if (monthsElapsed >= CONSENT_EXPIRY_MONTHS) {
        setShowBanner(true);
        setHasConsent(false);
        return;
      }

      setPreferences(savedPreferences);
      applyConsent(savedPreferences);
      setShowBanner(false);
      setHasConsent(true);
    } catch (error) {
      console.error('Error checking cookie consent:', error);
      setShowBanner(true);
      setHasConsent(false);
    }
  };

  const saveConsent = (prefs) => {
    const consentData = {
      timestamp: new Date().toISOString(),
      preferences: prefs
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
    setPreferences(prefs);
    applyConsent(prefs);
    setHasConsent(true);
    setShowBanner(false);
    setShowPreferences(false);
    document.body.style.overflow = '';
  };

  const applyConsent = (prefs) => {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
        ad_storage: prefs.marketing ? 'granted' : 'denied',
        ad_user_data: prefs.marketing ? 'granted' : 'denied',
        ad_personalization: prefs.marketing ? 'granted' : 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted'
      });
    }
    
    if (!prefs.analytics) {
      if (window.gtag) {
        window.gtag('config', 'G-P9DN7YN239', { 'anonymize_ip': true });
      }
      if (window._hsq) {
        window._hsq.push(['doNotTrack']);
      }
    }
    
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: prefs }));
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

  if (!showBanner && !showPreferences) return null;

  return (
    <>
      {/* Overlay bloqueador GDPR */}
      {(showBanner || showPreferences) && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99998]"
          style={{ 
            pointerEvents: 'auto',
            touchAction: 'none'
          }}
          onClick={(e) => e.preventDefault()}
          aria-hidden="true"
        />
      )}

      {/* Banner de cookies - Solo visible si showBanner y NO showPreferences */}
      {showBanner && !showPreferences && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-[99999] animate-in slide-in-from-bottom duration-500"
          role="dialog"
          aria-modal="true"
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
                      >
                        {t('cookiePolicy')}
                      </Link>
                      <span className="text-gray-400">•</span>
                      <Link 
                        to={createPageUrl("PrivacyPolicy")} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        {t('privacyPolicy')}
                      </Link>
                      <span className="text-gray-400">•</span>
                      <Link 
                        to={createPageUrl("LegalNotice")} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        {t('legalNotice')}
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 lg:flex-col xl:flex-row">
                    <Button
                      onClick={handleAcceptAll}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 h-11 shadow-lg hover:shadow-xl transition-all"
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
      )}

      {/* Modal de preferencias - Centrado y sin poder cerrar */}
      {showPreferences && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preferences-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 id="preferences-title" className="text-2xl font-bold text-gray-900">
                    {t('cookiePreferences')}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('cookiePreferencesDescription')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Cookies esenciales */}
              <div className="border-2 border-blue-200 rounded-xl p-5 bg-blue-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-base font-bold text-gray-900 cursor-default block mb-1">
                        {t('essentialCookies')}
                      </Label>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {t('essentialCookiesDescription')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Switch
                      checked={true}
                      disabled={true}
                      className="pointer-events-none data-[state=checked]:bg-blue-600"
                    />
                    <span className="text-xs text-blue-700 font-semibold">{t('alwaysActive')}</span>
                  </div>
                </div>
              </div>

              {/* Cookies analíticas */}
              <div className="border-2 border-gray-200 rounded-xl p-5 hover:border-green-300 hover:bg-green-50/30 transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="analytics" className="text-base font-bold text-gray-900 cursor-pointer block mb-1">
                        {t('analyticsCookies')}
                      </Label>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {t('analyticsCookiesDescription')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="analytics"
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
                    className="flex-shrink-0 data-[state=checked]:bg-green-600"
                  />
                </div>
              </div>

              {/* Cookies de marketing */}
              <div className="border-2 border-gray-200 rounded-xl p-5 hover:border-orange-300 hover:bg-orange-50/30 transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg className="w-6 h-6 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="marketing" className="text-base font-bold text-gray-900 cursor-pointer block mb-1">
                        {t('marketingCookies')}
                      </Label>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {t('marketingCookiesDescription')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="marketing"
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, marketing: checked })}
                    className="flex-shrink-0 data-[state=checked]:bg-orange-600"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAcceptEssential}
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-100 font-semibold h-12"
                >
                  {t('acceptEssentialCookies')}
                </Button>
                <Button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 font-semibold h-12 shadow-lg hover:shadow-xl transition-all"
                >
                  {t('savePreferences')}
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-green-600 hover:bg-green-700 font-semibold h-12 shadow-lg hover:shadow-xl transition-all"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('acceptAllCookies')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}