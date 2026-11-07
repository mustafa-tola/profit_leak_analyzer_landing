import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollManager() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const target = document.getElementById(id);
      const menuOpen = Boolean(document.getElementById('mobile-menu'));
      let timeout: number | undefined;
      const frame = requestAnimationFrame(() => {
        if (!menuOpen) {
          target?.scrollIntoView();
          return;
        }
        // Wait for the mobile menu collapse so the target position does not shift mid-scroll.
        timeout = window.setTimeout(() => target?.scrollIntoView(), 220);
      });
      return () => {
        cancelAnimationFrame(frame);
        if (timeout) window.clearTimeout(timeout);
      };
    }
    window.scrollTo(0, 0);
  }, [pathname, hash, key]);

  return null;
}
