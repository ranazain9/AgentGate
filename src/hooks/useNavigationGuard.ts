import { useState, useEffect, useCallback, useRef } from 'react';

export interface NavigationGuardState {
  /** Whether the unsaved-changes dialog is visible */
  isBlocked: boolean;
  /** The navigation action to resume if user confirms */
  proceed: () => void;
  /** Dismiss the dialog (stay on page) */
  reset: () => void;
  /** Wrap a navigation call — shows the dialog if there are unsaved changes */
  guardNavigation: (navigateFn: () => void) => void;
}

/**
 * Custom navigation guard that works with BrowserRouter.
 * Replaces `useBlocker` which requires a data router.
 *
 * - Sets `beforeunload` for browser refresh/close.
 * - Returns helpers to show an in-app confirmation dialog.
 */
export function useNavigationGuard(
  hasUnsavedChanges: boolean
): NavigationGuardState {
  const [isBlocked, setIsBlocked] = useState(false);
  const pendingCallback = useRef<(() => void) | null>(null);

  // Browser-level guard (refresh / tab close)
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setIsBlocked(false);
      pendingCallback.current = null;
    }

    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const guardNavigation = useCallback(
    (navigateFn: () => void) => {
      if (hasUnsavedChanges) {
        pendingCallback.current = navigateFn;
        setIsBlocked(true);
      } else {
        navigateFn();
      }
    },
    [hasUnsavedChanges]
  );

  const reset = useCallback(() => {
    pendingCallback.current = null;
    setIsBlocked(false);
  }, []);

  const proceed = useCallback(() => {
    const cb = pendingCallback.current;
    pendingCallback.current = null;
    setIsBlocked(false);
    if (cb) cb();
  }, []);

  return { isBlocked, proceed, reset, guardNavigation };
}