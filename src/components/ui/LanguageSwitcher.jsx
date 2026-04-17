import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    document.documentElement.lang = lng;
  };

  const current = i18n.language?.startsWith('en') ? 'en' : 'es';

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
      <button
        onClick={() => changeLanguage('es')}
        className={`px-2 py-1 text-xs font-medium rounded transition-all ${
          current === 'es' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
        }`}
        aria-label="Español"
      >
        ES
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 text-xs font-medium rounded transition-all ${
          current === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}

// Hook de compatibilidad para código que usa el viejo useLanguage
export function useLanguage() {
  const { t, i18n } = useTranslation();
  const language = i18n.language?.startsWith('en') ? 'en' : 'es';

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    document.documentElement.lang = lng;
  };

  return { t, language, changeLanguage };
}

// Provider de compatibilidad (ya no hace nada, i18next maneja el estado)
export function LanguageProvider({ children }) {
  return children;
}