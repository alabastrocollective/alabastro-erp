"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Evita envíos duplicados (doble clic) mientras una petición async está en curso.
 * El ref bloquea de inmediato; el state deshabilita botones en el siguiente render.
 */
export function useSubmitLock() {
  const lockRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const run = useCallback(async (fn: () => Promise<void>) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setIsSubmitting(true);
    try {
      await fn();
    } finally {
      lockRef.current = false;
      setIsSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    lockRef.current = false;
    setIsSubmitting(false);
  }, []);

  return { isSubmitting, run, reset };
}
