import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component ensures that the window scrolls to the top
 * whenever the route (pathname) changes, providing a fresh start for every page.
 * It intelligently skips scrolling if a hash (#section) is present to allow
 * for native anchor navigation.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // We only scroll to top if there is no hash in the URL.
    // If a hash exists, we let the browser handle the anchor scrolling.
    if (!hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant", // Use "instant" to avoid jank during page transitions
      });
    }
  }, [pathname, hash]);

  return null;
}
