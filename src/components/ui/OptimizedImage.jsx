import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon } from 'lucide-react';

const OptimizedImage = React.memo(function OptimizedImage({ 
  src, 
  alt = "", 
  className = "", 
  fallback = null,
  priority = false,
  objectFit = "cover",
  width,
  height,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  quality = 85
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [actualSrc, setActualSrc] = useState(src);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src || src.trim() === '') {
      setError(true);
      setIsLoading(false);
      return;
    }

    if (src.startsWith('blob:') || src.startsWith('data:')) {
      setActualSrc(src);
      setIsInView(true);
      return;
    }

    if (!src.startsWith('http://') && !src.startsWith('https://')) {
      setError(true);
      setIsLoading(false);
      return;
    }

    // Optimize Supabase images with parameters
    if (src.includes('supabase.co')) {
      try {
        const url = new URL(src);
        const optimalWidth = width || 400;
        const optimalHeight = height || 400;
        
        url.searchParams.set('width', optimalWidth.toString());
        url.searchParams.set('height', optimalHeight.toString());
        url.searchParams.set('quality', quality.toString());
        url.searchParams.set('resize', 'cover');
        url.searchParams.set('format', 'webp');
        
        // Preload critical images
        if (priority && typeof window !== 'undefined') {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = url.toString();
          link.fetchpriority = 'high';
          document.head.appendChild(link);
        }
        
        setActualSrc(url.toString());
      } catch (e) {
        setActualSrc(src);
      }
    } else {
      setActualSrc(src);
    }
  }, [src, width, height, quality, priority]);

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

  const handleLoad = React.useCallback(() => {
    setIsLoading(false);
    setError(false);
  }, []);

  const handleError = React.useCallback(() => {
    setIsLoading(false);
    setError(true);
  }, []);

  const defaultFallback = (
    <div className={`${className} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center`}>
      <ImageIcon className="w-1/3 h-1/3 text-gray-400" />
    </div>
  );

  if (error) {
    return fallback || defaultFallback;
  }

  return (
    <div 
      ref={imgRef} 
      className={`relative ${className}`}
      style={width && height ? { aspectRatio: `${width}/${height}` } : {}}
    >
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" 
          style={width && height ? { width, height } : {}}
        />
      )}
      {isInView && actualSrc && (
        <img
          src={actualSrc}
          alt={alt || "Imagen"}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          fetchpriority={priority ? "high" : "auto"}
          className={`${className} transition-opacity duration-150 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ 
            objectFit: objectFit || 'cover',
            width: '100%', 
            height: '100%',
            objectPosition: 'center'
          }}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
        />
      )}
    </div>
  );
});

export default OptimizedImage;