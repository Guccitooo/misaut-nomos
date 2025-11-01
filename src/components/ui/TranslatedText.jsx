import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "./LanguageSwitcher";

// Cache global de traducciones
const translationCache = new Map();

// Hook para traducción dinámica
export const useTranslatedContent = (originalText, skipTranslation = false) => {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    console.log('🌍 useTranslatedContent:', { originalText, language, skipTranslation });
    
    // Si es español, está vacío o debe omitirse, no traducir
    if (language === 'es' || !originalText || skipTranslation) {
      setTranslatedText(originalText);
      setIsTranslating(false);
      return;
    }

    // Generar clave de cache
    const cacheKey = `${language}_${originalText}`;

    // Verificar cache
    if (translationCache.has(cacheKey)) {
      console.log('✅ Cache hit:', cacheKey);
      setTranslatedText(translationCache.get(cacheKey));
      setIsTranslating(false);
      return;
    }

    // Traducir
    console.log('🔄 Traduciendo:', originalText);
    setIsTranslating(true);

    base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following text to ${language === 'en' ? 'English' : language}. 
      IMPORTANT RULES:
      - Only return the translated text, nothing else
      - Do NOT translate proper names (person names, business names, company names)
      - Do NOT translate location names (cities, provinces, countries)
      - Keep the same tone and style
      
      Text to translate:
      ${originalText}`,
      response_json_schema: null
    }).then(response => {
      const translated = response.data || originalText;
      console.log('✅ Traducido:', translated);
      translationCache.set(cacheKey, translated);
      setTranslatedText(translated);
      setIsTranslating(false);
    }).catch(error => {
      console.error('❌ Error traduciendo:', error);
      setTranslatedText(originalText);
      setIsTranslating(false);
    });
  }, [originalText, language, skipTranslation]);

  return { translatedText, isTranslating };
};

// Componente para mostrar texto traducido
export default function TranslatedText({ 
  text, 
  skipTranslation = false, 
  className = "",
  showLoader = false
}) {
  const { translatedText, isTranslating } = useTranslatedContent(text, skipTranslation);

  // Mostrar skeleton mientras traduce
  if (isTranslating && showLoader) {
    return (
      <span className={`${className} inline-block bg-gray-200 animate-pulse rounded`} style={{ minWidth: '80px', height: '1em' }}>
        &nbsp;
      </span>
    );
  }

  return <span className={className}>{translatedText}</span>;
}

// Limpiar cache
export const clearTranslationCache = () => {
  translationCache.clear();
};