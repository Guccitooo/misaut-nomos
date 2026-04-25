import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Saves and restores the window scroll position per route pathname.
 * Call this once in a top-level component (e.g. Layout or PageTransitions).
 */
export function useScrollRestore() {
  const { pathname } = useLocation();
  const scrollPositions = useRef({});
  const prevPathname = useRef(null);

  useEffect(() => {
    // Save scroll position of the route we're leaving
    if (prevPathname.current && prevPathname.current !== pathname) {
      scrollPositions.current[prevPathname.current] = window.scrollY;
    }

    // Restore scroll position for the route we're entering
    const saved = scrollPositions.current[pathname];
    if (saved != null) {
      // Defer to next paint so the page content has rendered
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved, behavior: 'instant' });
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    prevPathname.current = pathname;
  }, [pathname]);
}