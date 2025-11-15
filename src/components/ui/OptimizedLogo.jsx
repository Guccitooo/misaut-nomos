import React from 'react';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';

const SIZE_CONFIG = {
  sm: {
    container: 'w-8 h-8',
    icon: 'w-5 h-5',
    text: 'text-sm'
  },
  md: {
    container: 'w-12 h-12',
    icon: 'w-7 h-7',
    text: 'text-base'
  },
  lg: {
    container: 'w-16 h-16',
    icon: 'w-10 h-10',
    text: 'text-lg'
  }
};

export default function OptimizedLogo({ size = 'md', showText = false }) {
  const config = SIZE_CONFIG[size];
  
  return (
    <div className="flex items-center gap-2">
      <img
        src={LOGO_URL}
        alt="MisAutónomos"
        className={config.container}
        loading="eager"
        fetchpriority="high"
        decoding="sync"
        onError={(e) => {
          e.target.style.display = 'none';
          console.error('❌ Error cargando logo MisAutónomos');
        }}
      />
      {showText && (
        <span className={`font-bold text-gray-900 ${config.text}`}>
          MisAutónomos
        </span>
      )}
    </div>
  );
}