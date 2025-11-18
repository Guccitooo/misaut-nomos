import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon } from 'lucide-react';

export default function OptimizedImage({ 
  src, 
  alt, 
  className = "", 
  fallback = null,
  priority = false,
  objectFit = "cover",
  width,
  height
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [actualSrc, setActualSrc] = useState(src);
  const imgRef = useRef(null);

  useEffect(() => {
    console.log('🖼️ OptimizedImage montado:', { src, priority, width, height });
    
    if (!src || src.trim() === '') {
      console.log('❌ URL vacía, mostrando fallback');
      setError(true);
      setIsLoading(false);
      return;
    }

    if (src.startsWith('blob:') || src.startsWith('data:')) {
      console.log('✅ Preview local detectado');
      setActualSrc(src);
      setIsInView(true);
      return;
    }

    if (!src.startsWith('http://') && !src.startsWith('https://')) {
      console.log('⚠️ URL no válida:', src);
      setError(true);
      setIsLoading(false);
      return;
    }

    setActualSrc(src);
  }, [src]);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    console.log('✅ Imagen cargada:', actualSrc);
    setIsLoading(false);
    setError(false);
  };

  const handleError = (e) => {
    console.error('❌ Error cargando imagen:', actualSrc, e);
    setIsLoading(false);
    setError(true);
  };

  const defaultFallback = (
    <div className={`${className} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center`}>
      <ImageIcon className="w-1/3 h-1/3 text-gray-400" />
    </div>
  );

  if (error) {
    return fallback || defaultFallback;
  }

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {isLoading && (
        <div className={`absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse`} />
      )}
      {isInView && actualSrc && (
        <img
          src={actualSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          fetchpriority={priority ? "high" : "auto"}
          className={`${className} transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ objectFit }}
          onLoad={handleLoad}
          onError={handleError}
          decoding={priority ? "sync" : "async"}
        />
      )}
    </div>
  );
}