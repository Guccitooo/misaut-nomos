import React, { useState, useRef, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef(null);

  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;

    if (distance > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance * 0.5, PULL_THRESHOLD + 20));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      setPullDistance(0);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, isRefreshing]);

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 pointer-events-none"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        ) : (
          <RefreshCw 
            className="w-6 h-6 text-blue-600 transition-transform" 
            style={{
              transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)`
            }}
          />
        )}
      </div>
      <div style={{ paddingTop: isRefreshing ? '60px' : `${pullDistance}px`, transition: 'padding-top 200ms' }}>
        {children}
      </div>
    </div>
  );
}