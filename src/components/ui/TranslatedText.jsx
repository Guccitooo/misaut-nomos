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
    console.log('🌍 [TranslatedText] Hook ejecutándose:', { 
      originalText: originalText?.substring(0, 50) + '...', 
      language, 
      skipTranslation 
    });
    
    // Si es español, está vacío o debe omitirse, no traducir
    if (language === 'es' || !originalText || skipTranslation) {
      console.log('⏭️ [TranslatedText] Saltando traducción');
      setTranslatedText(originalText);
      setIsTranslating(false);
      return;
    }

    // Generar clave de cache
    const cacheKey = `${language}_${originalText}`;

    // Verificar cache
    if (translationCache.has(cacheKey)) {
      console.log('✅ [TranslatedText] Cache hit:', cacheKey.substring(0, 50));
      setTranslatedText(translationCache.get(cacheKey));
      setIsTranslating(false);
      return;
    }

    // Traducir
    console.log('🔄 [TranslatedText] Iniciando traducción:', originalText.substring(0, 100));
    setIsTranslating(true);

    base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following text to ${language === 'en' ? 'English' : 'French'}. 
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
      console.log('✅ [TranslatedText] Traducción completada:', translated.substring(0, 100));
      translationCache.set(cacheKey, translated);
      setTranslatedText(translated);
      setIsTranslating(false);
    }).catch(error => {
      console.error('❌ [TranslatedText] Error traduciendo:', error);
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
  const { language } = useLanguage();
  const { translatedText, isTranslating } = useTranslatedContent(text, skipTranslation);

  console.log('🎨 [TranslatedText] Renderizando:', {
    text: text?.substring(0, 30),
    language,
    isTranslating,
    translatedText: translatedText?.substring(0, 30)
  });

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