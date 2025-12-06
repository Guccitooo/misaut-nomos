import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { X, ChevronDown, ChevronUp, Shield, BarChart, Target } from 'lucide-react';

const CONSENT_KEY = 'cookie_consent';
const CONSENT_VERSION = 'v1.0';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
  });
  const [expandedSection, setExpandedSection] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    
    if (!savedConsent) {
      // Defer banner until page is idle to avoid blocking LCP
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => setTimeout(() => setShowBanner(true), 1000));
      } else {
        setTimeout(() => setShowBanner(true), 2000);
      }
    } else {
      try {
        const consent = JSON.parse(savedConsent);
        applyConsent(consent);
      } catch (error) {
        setTimeout(() => setShowBanner(true), 2000);
      }
    }

    // Load user in background (non-blocking)
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        base44.auth.me().then(setUser).catch(() => setUser(null));
      });
    } else {
      setTimeout(() => {
        base44.auth.me().then(setUser).catch(() => setUser(null));
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (showBanner || showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [showBanner, showModal]);

  const applyConsent = (consent) => {
    if (consent.analytics && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }

    if (consent.marketing && window.gtag) {
      window.gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
      });
    }
  };

  const saveConsent = async (consent) => {
    const consentData = {
      ...consent,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
    applyConsent(consent);

    if (user) {
      try {
        await base44.functions.invoke('saveCookieConsent', {
          consent_id: localStorage.getItem('device_id') || generateDeviceId(),
          user_id: user.id,
          accepted_essential: true,
          accepted_analytics: consent.analytics,
          accepted_marketing: consent.marketing,
          legal_version: CONSENT_VERSION
        });
      } catch (error) {
        console.error('Error saving consent to DB:', error);
      }
    }

    setShowBanner(false);
    setShowModal(false);
  };

  const generateDeviceId = () => {
    const id = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('device_id', id);
    return id;
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true
    });
  };

  const handleEssentialOnly = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const handleOpenModal = () => {
    setShowBanner(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowBanner(true);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {(showBanner || showModal) && (
        <div 
          className="fixed inset-0 bg-black/40 z-[9998] transition-opacity duration-150"
          style={{ opacity: showBanner || showModal ? 1 : 0 }}
        />
      )}

      {showBanner && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center px-4 pb-safe pointer-events-none"
          style={{ 
            opacity: showBanner ? 1 : 0,
            transition: 'opacity 150ms ease-in-out',
            marginBottom: 'env(safe-area-inset-bottom, 16px)'
          }}
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-2xl w-full pointer-events-auto" style={{ minHeight: '180px' }}>
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                🍪 Este sitio utiliza cookies
              </h3>
              <p className="text-sm text-gray-600">
                Utilizamos cookies para mejorar tu experiencia. Puedes aceptar todas o configurar solo las necesarias.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleAcceptAll}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 h-11"
              >
                Aceptar todas
              </Button>
              <Button
                onClick={handleEssentialOnly}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 font-semibold px-6 h-11"
              >
                Solo esenciales
              </Button>
              <Button
                onClick={handleOpenModal}
                variant="ghost"
                className="text-blue-600 hover:bg-blue-50 font-medium text-sm underline px-4 h-11"
              >
                Configurar cookies
              </Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ 
            opacity: showModal ? 1 : 0,
            transition: 'opacity 150ms ease-in-out'
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Preferencias de cookies
              </h2>
              <p className="text-sm text-gray-600">
                Gestiona qué cookies quieres permitir en MisAutónomos
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">Cookies esenciales</h4>
                      <p className="text-xs text-gray-500">Necesarias para el funcionamiento</p>
                    </div>
                  </div>
                  <Badge className="bg-gray-300 text-gray-700 text-xs cursor-not-allowed">
                    Siempre activas
                  </Badge>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('analytics')}
                  className="w-full bg-white hover:bg-gray-50 px-4 py-3 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BarChart className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <h4 className="font-semibold text-sm text-gray-900">Cookies analíticas</h4>
                      <p className="text-xs text-gray-500">Google Analytics</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreferences({...preferences, analytics: !preferences.analytics});
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        preferences.analytics ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      role="switch"
                      aria-checked={preferences.analytics}
                    >
                      <span 
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          preferences.analytics ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    {expandedSection === 'analytics' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                
                {expandedSection === 'analytics' && (
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Nos ayudan a entender cómo interactúan los usuarios con la web para mejorar la experiencia.
                    </p>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('marketing')}
                  className="w-full bg-white hover:bg-gray-50 px-4 py-3 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-orange-600" />
                    <div className="text-left">
                      <h4 className="font-semibold text-sm text-gray-900">Cookies de marketing</h4>
                      <p className="text-xs text-gray-500">Publicidad personalizada</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreferences({...preferences, marketing: !preferences.marketing});
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        preferences.marketing ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      role="switch"
                      aria-checked={preferences.marketing}
                    >
                      <span 
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          preferences.marketing ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    {expandedSection === 'marketing' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                
                {expandedSection === 'marketing' && (
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Utilizadas para mostrar publicidad relevante y medir la efectividad de nuestras campañas.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSavePreferences}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11"
              >
                Guardar preferencias
              </Button>
              <Button
                onClick={handleCloseModal}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 font-medium h-11"
              >
                Volver
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const Badge = ({ className, children }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-medium ${className}`}>
    {children}
  </span>
);