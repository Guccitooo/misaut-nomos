import React from 'react';

const LOGO_BASE = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';

// Supabase Image Transform: sirve el logo a tamaño real de uso (48x48 o 96x96 para retina)
// Ahorra ~1.2 MB por carga
const getLogoUrl = (px) =>
  `https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/render/image/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png?width=${px}&height=${px}&quality=80&format=webp`;

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

const SIZE_PX = { sm: 32, md: 48, lg: 64 };

export default function OptimizedLogo({ size = 'md', showText = false }) {
  const config = SIZE_CONFIG[size];
  const px = SIZE_PX[size];
  const src1x = getLogoUrl(px);
  const src2x = getLogoUrl(px * 2);

  return (
    <div className="flex items-center gap-2">
      <img
        src={src1x}
        srcSet={`${src1x} 1x, ${src2x} 2x`}
        alt="MisAutónomos"
        className={config.container}
        width={px}
        height={px}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onError={(e) => {
          // Fallback al PNG original si falla el transform
          e.target.srcset = '';
          e.target.src = LOGO_BASE;
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