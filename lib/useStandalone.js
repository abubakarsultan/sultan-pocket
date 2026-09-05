'use client';
import { useEffect, useState } from 'react';

export function useStandalone() {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const check = () => {
      const isTwa = document.referrer?.startsWith('android-app://');
      setStandalone(media.matches || isTwa || window.navigator.standalone === true);
    };
    check();
    media.addEventListener?.('change', check);
    return () => media.removeEventListener?.('change', check);
  }, []);
  return standalone;
}
