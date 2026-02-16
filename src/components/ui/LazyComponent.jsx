import React, { Suspense, lazy } from 'react';

export default function LazyComponent({ loader, fallback = null }) {
  const Component = lazy(loader);
  
  return (
    <Suspense fallback={fallback || <div className="min-h-[200px]" />}>
      <Component />
    </Suspense>
  );
}

// Helper para crear lazy components fácilmente
export const createLazyComponent = (importFn) => {
  return React.lazy(importFn);
};