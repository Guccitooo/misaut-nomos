/**
 * Cookie Consent Management Service
 * Handles localStorage-based consent tracking for RGPD compliance
 */

export function getCookieConsent() {
  try {
    const stored = localStorage.getItem('cookie_consent');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function hasConsent(category) {
  const consent = getCookieConsent();
  return consent && consent[category] === true;
}

export function setConsent(essential, analytics, marketing) {
  const consent = {
    essential,
    analytics,
    marketing,
    timestamp: new Date().toISOString(),
    version: 'cookies-v1'
  };
  localStorage.setItem('cookie_consent', JSON.stringify(consent));
}

export function clearCookieConsent() {
  localStorage.removeItem('cookie_consent');
  localStorage.removeItem('consent_id');
}

/**
 * Revoke all GA cookies when user opts out of analytics
 */
export function revokeAnalyticsCookies() {
  if (typeof window === 'undefined') return;
  
  const cookieNames = ['_ga', '_gid', '_gat'];
  const domain = window.location.hostname;
  
  // Try different domain patterns
  const domains = [
    '',
    domain,
    '.' + domain,
    '.' + domain.split('.').slice(-2).join('.')
  ];
  
  document.cookie.split(';').forEach(c => {
    const name = c.trim().split('=')[0];
    if (name.startsWith('_ga')) {
      domains.forEach(d => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? '; domain=' + d : ''}`;
      });
    }
  });
}

/**
 * Initialize analytics if consent given
 */
export function initializeAnalyticsIfConsented() {
  if (!hasConsent('analytics')) return;
  
  if (window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted'
    });
  }
}

/**
 * Check if this is first visit (no cookie consent recorded)
 */
export function isFirstVisit() {
  return !localStorage.getItem('cookie_consent');
}