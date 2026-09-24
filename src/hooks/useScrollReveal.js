// ==========================================================================
// CHRIS SHOPPER — SCROLL REVEAL & INTERSECTION OBSERVER HOOK
// ==========================================================================

import { useEffect } from 'react';

/**
 * useScrollReveal: observes elements with `.reveal-on-scroll` class
 * and attaches `.is-revealed` when within the viewport threshold.
 */
export function useScrollReveal(dependency = null) {
  useEffect(() => {
    // Respect user's reduced motion accessibility preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observerCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          // Once revealed, unobserve to free GPU/CPU resources
          observer.unobserve(entry.target);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const elements = document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)');
    elements.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [dependency]);
}
