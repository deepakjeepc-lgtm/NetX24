/**
 * Utility for triggering haptic feedback (Vibration API) on supported mobile devices.
 */
export const triggerHaptic = (pattern: number | number[] = 10) => {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration errors or policy blocks
    }
  }
};

export const haptic = {
  /** Subtle tick for tab switches and icon clicks */
  selection: () => triggerHaptic(8),
  /** Light impact for general button taps */
  light: () => triggerHaptic(12),
  /** Medium impact for key actions like adding to cart */
  medium: () => triggerHaptic(25),
  /** Heavy impact for primary calls to action */
  heavy: () => triggerHaptic(45),
  /** Multi-pulse pattern for successful actions */
  success: () => triggerHaptic([12, 40, 20]),
};
