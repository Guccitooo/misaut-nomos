import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "./LanguageSwitcher";

// Cache de traducciones para evitar llamadas duplicadas
const translationCache = new Map();

export const useTranslatedContent = (originalText, skipTranslation = false) => {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // Si es español o está vacío, no traducir
    if (language === 'es' || !originalText || skipTranslation) {
      setTranslatedText(originalText);
      return;
    }

    // Generar clave de cache
    const cacheKey = `${language}_${originalText}`;

    // Verificar cache
    if (translationCache.has(cacheKey)) {
      setTranslatedText(translationCache.get(cacheKey));
      return;
    }

    // Traducir usando la API de Base44
    const translateText = async () => {
      setIsTranslating(true);
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Translate the following text to ${language === 'en' ? 'English' : language}. 
          Only return the translated text, nothing else. Do not translate proper names, business names, or person names.
          
          Text to translate:
          ${originalText}`,
          response_json_schema: null
        });

        const translated = response.data || originalText;
        
        // Guardar en cache
        translationCache.set(cacheKey, translated);
        setTranslatedText(translated);
      } catch (error) {
        console.error('Error translating text:', error);
        setTranslatedText(originalText);
      } finally {
        setIsTranslating(false);
      }
    };

    translateText();
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

  if (isTranslating && showLoader) {
    return (
      <span className={`${className} animate-pulse bg-gray-200 rounded`}>
        {text}
      </span>
    );
  }

  return <span className={className}>{translatedText}</span>;
}