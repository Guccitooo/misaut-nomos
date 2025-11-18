import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Cookie, Settings, CheckCircle, Shield, BarChart3, Megaphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "./LanguageSwitcher";

const STORAGE_KEY = 'misautonomos_cookie_prefs';
const CONSENT_ID_KEY = 'misautonomos_consent_id';
const LEGAL_VERSION = 'cookies-v1';
const CONSENT_EXPIRY_MONTHS = 12;

const generateConsentId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function CookieBanner() {
  const { t, language } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [consentId, setConsentId] = useState(null);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    initializeCookieConsent();
    
    const handleReopenEvent = () => {
      setShowBanner(false);
      setShowPreferences(true);
    };
    
    window.addEventListener('cookie-consent-reopen', handleReopenEvent);
    
    return () => {
      window.removeEventListener('cookie-consent-reopen', handleReopenEvent);
    };
  }, []);

  useEffect(() => {
    if (showBanner || showPreferences) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showBanner, showPreferences]);

  const initializeCookieConsent = () => {
    try {
      let storedConsentId = localStorage.getItem(CONSENT_ID_KEY);
      if (!storedConsentId) {
        storedConsentId = generateConsentId();
        localStorage.setItem(CONSENT_ID_KEY, storedConsentId);
      }
      setConsentId(storedConsentId);

      const consentData = localStorage.getItem(STORAGE_KEY);
      
      if (!consentData) {
        setShowBanner(true);
        blockNonEssentialScripts();
        return;
      }

      const parsed = JSON.parse(consentData);
      
      if (parsed.legalVersion !== LEGAL_VERSION) {
        setShowBanner(true);
        blockNonEssentialScripts();
        return;
      }

      const consentDate = new Date(parsed.timestamp);
      const now = new Date();
      const monthsElapsed = (now - consentDate) / (1000 * 60 * 60 * 24 * 30);

      if (monthsElapsed >= CONSENT_EXPIRY_MONTHS) {
        setShowBanner(true);
        blockNonEssentialScripts();
        return;
      }

      setPreferences(parsed.preferences);
      applyConsent(parsed.preferences);
      setShowBanner(false);
    } catch (error) {
      console.error('Error initializing cookie consent:', error);
      setShowBanner(true);
      blockNonEssentialScripts();
    }
  };

  const blockNonEssentialScripts = () => {
    if (window.gtag) {
      window.gtag('consent', 'default', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'functionality_storage': 'granted',
        'security_storage': 'granted'
      });
    }
  };

  const applyConsent = (prefs) => {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': prefs.analytics ? 'granted' : 'denied',
        'ad_storage': prefs.marketing ? 'granted' : 'denied',
        'ad_user_data': prefs.marketing ? 'granted' : 'denied',
        'ad_personalization': prefs.marketing ? 'granted' : 'denied',
        'functionality_storage': 'granted',
        'security_storage': 'granted'
      });
    }

    if (prefs.analytics) {
      loadAnalyticsScripts();
    }

    if (prefs.marketing) {
      loadMarketingScripts();
    }
  };

  const loadAnalyticsScripts = () => {
    if (window.gtag && !window._analyticsLoaded) {
      window.gtag('config', 'G-P9DN7YN239', {
        'anonymize_ip': false,
        'send_page_view': true
      });
      window._analyticsLoaded = true;
    }
  };

  const loadMarketingScripts = () => {
    if (!window._marketingLoaded) {
      window._marketingLoaded = true;
    }
  };

  const saveConsent = async (prefs) => {
    const consentData = {
      timestamp: new Date().toISOString(),
      preferences: prefs,
      legalVersion: LEGAL_VERSION
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
    
    try {
      let userId = null;
      try {
        const user = await base44.auth.me();
        userId = user?.id;
      } catch (error) {
        userId = null;
      }

      await base44.functions.invoke('saveCookieConsent', {
        consentId: consentId,
        userId: userId,
        acceptedEssential: true,
        acceptedAnalytics: prefs.analytics,
        acceptedMarketing: prefs.marketing,
        language: language,
        legalVersion: LEGAL_VERSION
      });
    } catch (error) {
      console.error('Error saving consent to database:', error);
    }

    setPreferences(prefs);
    applyConsent(prefs);
    setShowBanner(false);
    setShowPreferences(false);
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true
    });
  };

  const handleAcceptEssential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const handleOpenPreferences = () => {
    setShowBanner(false);
    setShowPreferences(true);
  };

  if (!showBanner && !showPreferences) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99998]"
        style={{ 
          pointerEvents: 'auto',
          touchAction: 'none'
        }}
        onClick={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
        aria-hidden="true"
      />

      {showBanner && !showPreferences && (
        <div 
          className="fixed inset-x-0 bottom-0 z-[99999] animate-in slide-in-from-bottom duration-500"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-description"
        >
          <Card className="rounded-none border-0 border-t-4 border-blue-600 shadow-2xl bg-white">
            <CardContent className="p-6 md:p-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Cookie className="w-6 h-6 text-blue-600" />
                      </div>
                      <h2 id="cookie-banner-title" className="text-2xl font-bold text-gray-900">
                        {t('cookiesBannerTitle')}
                      </h2>
                    </div>
                    <p id="cookie-banner-description" className="text-gray-700 text-base leading-relaxed mb-4">
                      {t('cookiesBannerDescription')}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-gray-600 font-medium">{t('learnMoreCookies')}</span>
                      <Link 
                        to={createPageUrl("CookiePolicy")} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-semibold"
                      >
                        {t('cookiePolicy')}
                      </Link>
                      <span className="text-gray-400">•</span>
                      <Link 
                        to={createPageUrl("PrivacyPolicy")} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-semibold"
                      >
                        {t('privacyPolicy')}
                      </Link>
                      <span className="text-gray-400">•</span>
                      <Link 
                        to={createPageUrl("LegalNotice")} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-semibold"
                      >
                        {t('legalNotice')}
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:min-w-[280px]">
                    <Button
                      onClick={handleAcceptAll}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all h-12"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {t('acceptAllCookies')}
                    </Button>
                    <Button
                      onClick={handleAcceptEssential}
                      size="lg"
                      variant="outline"
                      className="border-2 border-gray-400 hover:border-gray-600 hover:bg-gray-50 font-bold h-12"
                    >
                      {t('acceptEssentialCookies')}
                    </Button>
                    <Button
                      onClick={handleOpenPreferences}
                      size="lg"
                      variant="ghost"
                      className="text-gray-700 hover:bg-gray-100 font-semibold h-12"
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      {t('configureCookies')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showPreferences && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preferences-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Settings className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 id="preferences-title" className="text-2xl font-bold text-gray-900 mb-2">
                    {t('cookiePreferences')}
                  </h2>
                  <p className="text-gray-600">
                    {t('cookiePreferencesDescription')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="border-2 border-blue-300 rounded-2xl p-6 bg-blue-50/50 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-lg font-bold text-gray-900 cursor-default block mb-2">
                        {t('essentialCookies')}
                      </Label>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {t('essentialCookiesDescription')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Switch
                      checked={true}
                      disabled={true}
                      className="pointer-events-none data-[state=checked]:bg-blue-600"
                    />
                    <span className="text-xs text-blue-700 font-bold uppercase tracking-wide">
                      {t('alwaysActive')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-2 border-gray-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-md transition-all bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <BarChart3 className="w-6 h-6 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="analytics" className="text-lg font-bold text-gray-900 cursor-pointer block mb-2">
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

              <div className="border-2 border-gray-200 rounded-2xl p-6 hover:border-orange-300 hover:shadow-md transition-all bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Megaphone className="w-6 h-6 text-orange-700" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="marketing" className="text-lg font-bold text-gray-900 cursor-pointer block mb-2">
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
              <p className="text-xs text-gray-600 mb-4 text-center">
                {language === 'es' 
                  ? '⚠️ Debes guardar tus preferencias o aceptar al menos las cookies esenciales para continuar'
                  : '⚠️ You must save your preferences or accept at least essential cookies to continue'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAcceptEssential}
                  variant="outline"
                  className="flex-1 border-2 border-gray-400 hover:border-gray-600 hover:bg-gray-100 font-bold h-12"
                >
                  {t('acceptEssentialCookies')}
                </Button>
                <Button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold h-12 shadow-lg hover:shadow-xl transition-all"
                >
                  {t('savePreferences')}
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-green-600 hover:bg-green-700 font-bold h-12 shadow-lg hover:shadow-xl transition-all"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
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

export { LEGAL_VERSION, STORAGE_KEY };