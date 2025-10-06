import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  enabled?: boolean;
  interval?: number; // en millisecondes
}

/**
 * Hook pour rafraîchir automatiquement les données à intervalles réguliers
 * @param callback - Fonction à exécuter pour rafraîchir les données
 * @param options - Options de configuration (enabled, interval)
 */
export function useAutoRefresh(
  callback: () => void | Promise<void>,
  options: UseAutoRefreshOptions = {}
) {
  const { enabled = true, interval = 10000 } = options; // 10 secondes par défaut
  const callbackRef = useRef(callback);

  // Toujours garder la dernière version du callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      callbackRef.current();
    }, interval);

    return () => clearInterval(intervalId);
  }, [enabled, interval]);
}
