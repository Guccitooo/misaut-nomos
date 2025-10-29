import React, { useState } from "react";
import { ImageIcon } from "lucide-react";

export default function OptimizedImage({ 
  src, 
  alt, 
  className = "", 
  fallbackClassName = "",
  aspectRatio = "aspect-square",
  priority = false 
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`${className} ${aspectRatio} bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center ${fallbackClassName}`}>
        <ImageIcon className="w-12 h-12 text-blue-300" />
      </div>
    );
  }

  return (
    <div className={`${className} ${aspectRatio} relative overflow-hidden bg-gray-100`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}