/**
 * Generate a UUID v4 string that works in any browsing context.
 * Falls back from crypto.randomUUID() (secure-context only) to a
 * Math.random-based implementation for dev/preview environments
 * served over HTTP.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // crypto.randomUUID throws in insecure contexts
    }
  }

  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}