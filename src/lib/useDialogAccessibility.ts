'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getVisibleFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

interface UseDialogAccessibilityOptions {
  isOpen: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  lockBodyScroll?: boolean;
  restoreFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Provides WCAG 2.1 AA dialog/drawer accessibility:
 * - Captures & restores keyboard focus to the triggering element on close
 * - Moves initial focus cleanly into the container
 * - Traps Tab / Shift+Tab strictly inside the container
 * - Locks background page scroll safely on iOS Safari without jumping scroll position
 */
export function useDialogAccessibility({
  isOpen,
  containerRef,
  onClose,
  lockBodyScroll = true,
  restoreFocusRef,
}: UseDialogAccessibilityOptions) {
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused =
      (restoreFocusRef?.current as HTMLElement | null) ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);

    // Move focus into the dialog/drawer on open
    const focusTimer = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      if (container.contains(document.activeElement)) return;
      const focusables = getVisibleFocusableElements(container);
      if (focusables.length > 0) {
        focusables[0].focus({ preventScroll: true });
      } else {
        container.focus({ preventScroll: true });
      }
    });

    // iOS-safe body scroll lock (prevents background page rubber-banding under sheets/drawers)
    let savedScrollY = 0;
    let prevOverflow = '';
    let prevPosition = '';
    let prevTop = '';
    let prevWidth = '';
    let prevPaddingRight = '';

    if (lockBodyScroll) {
      savedScrollY = window.scrollY;
      const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
      prevOverflow = document.body.style.overflow;
      prevPosition = document.body.style.position;
      prevTop = document.body.style.top;
      prevWidth = document.body.style.width;
      prevPaddingRight = document.body.style.paddingRight;

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = '100%';
      if (scrollbarGap > 0) {
        document.body.style.paddingRight = `${scrollbarGap}px`;
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const container = containerRef.current;
      if (!container) return;

      const focusables = getVisibleFocusableElements(container);
      if (focusables.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (!active || active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);

      if (lockBodyScroll) {
        document.body.style.overflow = prevOverflow;
        document.body.style.position = prevPosition;
        document.body.style.top = prevTop;
        document.body.style.width = prevWidth;
        document.body.style.paddingRight = prevPaddingRight;
        window.scrollTo(0, savedScrollY);
      }

      if (previouslyFocused && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [isOpen, containerRef, onClose, lockBodyScroll, restoreFocusRef]);
}
