import React, { useState, useEffect } from 'react';
import { Briefcase } from 'lucide-react';

export default function OptimizedLogo({ size = "md", className = "" }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const sizes = {
    sm: { container: "w-8 h-8", icon: "w-5 h-5", text: "text-xs" },
    md: { container: "w-10 h-10", icon: "w-6 h-6", text: "text-sm" },
    lg: { container: "w-16 h-16", icon: "w-10 h-10", text: "text-base" },
  };

  const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/f1c507180_123.png";

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
    img.src = logoUrl;
  }, []);

  const fallback = (
    <div className={`${sizes[size].container} ${className} bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg`}>
      <Briefcase className={`${sizes[size].icon} text-orange-400`} />
    </div>
  );

  if (imageError || !logoUrl) {
    return fallback;
  }

  return (
    <div className={`${sizes[size].container} ${className} rounded-xl overflow-hidden flex-shrink-0 relative`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 animate-pulse flex items-center justify-center">
          <Briefcase className={`${sizes[size].icon} text-orange-400`} />
        </div>
      )}
      <img 
        src={logoUrl}
        alt="MisAutónomos"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="eager"
        fetchpriority="high"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
}