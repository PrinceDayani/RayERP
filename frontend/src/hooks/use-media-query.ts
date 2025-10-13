// frontend/src/hooks/use-media-query.ts
import { useState, useEffect } from 'react';

/**
 * Custom hook that returns whether a media query matches
 * @param query The media query to check
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Return early if SSR (no window object)
    if (typeof window === 'undefined') return;
    
    // Create MediaQueryList object
    const media = window.matchMedia(query);
    
    // Update matches state with current match value
    const updateMatches = () => setMatches(media.matches);
    
    // Set initial value
    updateMatches();
    
    // Listen for changes
    if (media.addEventListener) {
      media.addEventListener('change', updateMatches);
      return () => media.removeEventListener('change', updateMatches);
    } else {
      // Fallback for older browsers
      media.addListener(updateMatches);
      return () => media.removeListener(updateMatches);
    }
  }, [query]);

  return matches;
}