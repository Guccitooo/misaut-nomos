import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "./LanguageSwitcher";

// Cache global de traducciones para evitar llamadas duplicadas
const translationCache = new Map();

// Cola de traducciones pendientes para batch processing
let translationQueue = [];
let isProcessing = false;

// Función para procesar traducciones en batch
const processTranslationQueue = async () => {
  if (isProcessing || translationQueue.length === 0) return;
  
  isProcessing = true;
  const batch = [...translationQueue];
  translationQueue = [];
  
  // Procesar todas las traducciones pendientes
  await Promise.all(
    batch.map(async ({ text, language, resolve }) => {
      const cacheKey = `${language}_${text}`;
      
      if (translationCache.has(cacheKey)) {
        resolve(translationCache.get(cacheKey));
        return;
      }
      
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Translate the following text to ${language === 'en' ? 'English' : language}. 
          IMPORTANT RULES:
          - Only return the translated text, nothing else
          - Do NOT translate proper names (person names, business names, company names)
          - Do NOT translate location names (cities, provinces, countries)
          - Keep the same tone and style
          
          Text to translate:
          ${text}`,
          response_json_schema: null
        });

        const translated = response.data || text;
        translationCache.set(cacheKey, translated);
        resolve(translated);
      } catch (error) {
        console.error('Error translating text:', error);
        resolve(text);
      }
    })
  );
  
  isProcessing = false;
  
  // Procesar siguiente batch si hay más en cola
  if (translationQueue.length > 0) {
    setTimeout(processTranslationQueue, 100);
  }
};

// Hook mejorado para traducción dinámica
export const useTranslatedContent = (originalText, skipTranslation = false) => {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // Si es español, está vacío o debe omitirse, no traducir
    if (language === 'es' || !originalText || skipTranslation) {
      setTranslatedText(originalText);
      setIsTranslating(false);
      return;
    }

    // Generar clave de cache
    const cacheKey = `${language}_${originalText}`;

    // Verificar cache inmediatamente
    if (translationCache.has(cacheKey)) {
      setTranslatedText(translationCache.get(cacheKey));
      setIsTranslating(false);
      return;
    }

    // Indicar que está traduciendo
    setIsTranslating(true);

    // Añadir a la cola de traducciones
    const translationPromise = new Promise((resolve) => {
      translationQueue.push({ text: originalText, language, resolve });
    });

    // Procesar cola después de un pequeño delay (para agrupar)
    setTimeout(processTranslationQueue, 50);

    // Esperar resultado
    translationPromise.then((translated) => {
      setTranslatedText(translated);
      setIsTranslating(false);
    });
  }, [originalText, language, skipTranslation]);

  return { translatedText, isTranslating };
};

// Componente para mostrar texto traducido con indicador de carga
export default function TranslatedText({ 
  text, 
  skipTranslation = false, 
  className = "",
  showLoader = false,
  fallback = null
}) {
  const { translatedText, isTranslating } = useTranslatedContent(text, skipTranslation);

  // Si está traduciendo y hay un fallback, mostrarlo
  if (isTranslating && fallback) {
    return fallback;
  }

  // Si está traduciendo y showLoader está activo, mostrar skeleton
  if (isTranslating && showLoader) {
    return (
      <span className={`${className} inline-block bg-gray-200 animate-pulse rounded`} style={{ minWidth: '100px', minHeight: '1em' }}>
        &nbsp;
      </span>
    );
  }

  return <span className={className}>{translatedText}</span>;
}

// Función auxiliar para pre-cargar traducciones
export const preloadTranslation = (text, language) => {
  const cacheKey = `${language}_${text}`;
  if (!translationCache.has(cacheKey) && language !== 'es') {
    translationQueue.push({ 
      text, 
      language, 
      resolve: (translated) => {
        translationCache.set(cacheKey, translated);
      }
    });
    setTimeout(processTranslationQueue, 50);
  }
};

// Función para limpiar cache (útil si memoria es problema)
export const clearTranslationCache = () => {
  translationCache.clear();
};