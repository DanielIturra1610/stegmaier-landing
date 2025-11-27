/**
 * useSearchModal Hook
 *
 * Manages global search modal state with keyboard shortcut support.
 * Automatically opens search modal with Cmd+K (Mac) or Ctrl+K (Windows/Linux).
 *
 * Usage:
 * ```tsx
 * const { isOpen, openSearch, closeSearch } = useSearchModal();
 *
 * return (
 *   <>
 *     <button onClick={openSearch}>Search</button>
 *     <GlobalSearchModal
 *       isOpen={isOpen}
 *       onClose={closeSearch}
 *     />
 *   </>
 * );
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseSearchModalOptions {
  /**
   * Enable keyboard shortcut (Cmd+K / Ctrl+K)
   * @default true
   */
  enableKeyboardShortcut?: boolean;

  /**
   * Custom keyboard shortcut key
   * @default 'k'
   */
  shortcutKey?: string;

  /**
   * Callback when modal opens
   */
  onOpen?: () => void;

  /**
   * Callback when modal closes
   */
  onClose?: () => void;
}

export interface UseSearchModalReturn {
  /**
   * Whether search modal is open
   */
  isOpen: boolean;

  /**
   * Open search modal
   */
  openSearch: () => void;

  /**
   * Close search modal
   */
  closeSearch: () => void;

  /**
   * Toggle search modal
   */
  toggleSearch: () => void;
}

/**
 * Hook for managing global search modal state
 */
export const useSearchModal = (
  options: UseSearchModalOptions = {}
): UseSearchModalReturn => {
  const {
    enableKeyboardShortcut = true,
    shortcutKey = 'k',
    onOpen,
    onClose: onCloseCallback
  } = options;

  const [isOpen, setIsOpen] = useState<boolean>(false);

  /**
   * Open search modal
   */
  const openSearch = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
    console.log('🔍 [useSearchModal] Search modal opened');
  }, [onOpen]);

  /**
   * Close search modal
   */
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    onCloseCallback?.();
    console.log('🔍 [useSearchModal] Search modal closed');
  }, [onCloseCallback]);

  /**
   * Toggle search modal
   */
  const toggleSearch = useCallback(() => {
    if (isOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  }, [isOpen, openSearch, closeSearch]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    if (!enableKeyboardShortcut) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      const isModifierPressed = event.metaKey || event.ctrlKey;
      const isCorrectKey = event.key.toLowerCase() === shortcutKey.toLowerCase();

      if (isModifierPressed && isCorrectKey) {
        event.preventDefault();
        toggleSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableKeyboardShortcut, shortcutKey, toggleSearch]);

  /**
   * Prevent body scroll when modal is open
   */
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restore scroll position
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  return {
    isOpen,
    openSearch,
    closeSearch,
    toggleSearch
  };
};

export default useSearchModal;
