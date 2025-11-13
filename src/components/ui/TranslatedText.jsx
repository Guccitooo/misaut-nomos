import React from 'react';
import { useLanguage } from './LanguageSwitcher';

export default function TranslatedText({ text }) {
  const { t } = useLanguage();
  
  // Si el texto es una clave de traducción conocida, traducirla
  const translated = t(text);
  
  // Si no hay traducción específica, devolver el texto original
  return <>{translated !== text ? translated : text}</>;
}