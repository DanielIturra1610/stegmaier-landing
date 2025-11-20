/**
 * useNotificationPolling Hook
 *
 * Implements real-time notification polling for the application.
 * Automatically polls for new notifications at a configurable interval.
 *
 * Features:
 * - Automatic polling when user is authenticated
 * - Configurable polling interval
 * - Pauses when tab is not visible (visibility API)
 * - Handles errors gracefully
 * - Cleanup on unmount
 *
 * Usage:
 * ```tsx
 * const { unreadCount, notifications, refreshNotifications } = useNotificationPolling({
 *   enabled: true,
 *   interval: 30000 // Poll every 30 seconds
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import notificationService, { type Notification } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

export interface UseNotificationPollingOptions {
  /**
   * Whether polling is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Polling interval in milliseconds
   * @default 30000 (30 seconds)
   */
  interval?: number;

  /**
   * Whether to pause polling when tab is not visible
   * @default true
   */
  pauseWhenHidden?: boolean;

  /**
   * Maximum number of notifications to fetch
   * @default 20
   */
  limit?: number;

  /**
   * Callback when new notifications are received
   */
  onNewNotifications?: (notifications: Notification[]) => void;

  /**
   * Callback when unread count changes
   */
  onUnreadCountChange?: (count: number) => void;
}

export interface UseNotificationPollingReturn {
  /**
   * Current unread notification count
   */
  unreadCount: number;

  /**
   * Latest notifications
   */
  notifications: Notification[];

  /**
   * Whether currently loading notifications
   */
  isLoading: boolean;

  /**
   * Any error that occurred
   */
  error: Error | null;

  /**
   * Manually trigger a refresh
   */
  refreshNotifications: () => Promise<void>;

  /**
   * Start polling
   */
  startPolling: () => void;

  /**
   * Stop polling
   */
  stopPolling: () => void;

  /**
   * Whether polling is currently active
   */
  isPolling: boolean;
}

/**
 * Hook for polling notifications in real-time
 */
export const useNotificationPolling = (
  options: UseNotificationPollingOptions = {}
): UseNotificationPollingReturn => {
  const {
    enabled = true,
    interval = 30000, // 30 seconds default
    pauseWhenHidden = true,
    limit = 20,
    onNewNotifications,
    onUnreadCountChange
  } = options;

  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  // Use refs to track polling state and avoid stale closures
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  const previousUnreadCountRef = useRef<number>(0);

  /**
   * Fetch notifications from the server
   */
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch unread count and latest notifications in parallel
      const [countResponse, notificationsResponse] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getUserNotifications('unread', 1, limit)
      ]);

      // Update unread count
      const newCount = countResponse;
      setUnreadCount(newCount);

      // Check if unread count changed
      if (newCount !== previousUnreadCountRef.current) {
        onUnreadCountChange?.(newCount);
        previousUnreadCountRef.current = newCount;
      }

      // Update notifications list
      const newNotifications = notificationsResponse.notifications || [];
      setNotifications(newNotifications);

      // Notify about new notifications
      if (newNotifications.length > 0) {
        onNewNotifications?.(newNotifications);
      }

      console.log('📬 [useNotificationPolling] Fetched notifications:', {
        unreadCount: newCount,
        notificationsCount: newNotifications.length
      });
    } catch (err) {
      console.error('❌ [useNotificationPolling] Error fetching notifications:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user, limit, onNewNotifications, onUnreadCountChange]);

  /**
   * Start the polling interval
   */
  const startPolling = useCallback(() => {
    if (!enabled || !user) {
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Fetch immediately
    fetchNotifications();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      // Only poll if tab is visible (if pauseWhenHidden is true)
      if (!pauseWhenHidden || isVisibleRef.current) {
        fetchNotifications();
      }
    }, interval);

    setIsPolling(true);
    console.log('▶️ [useNotificationPolling] Started polling with interval:', interval);
  }, [enabled, user, interval, pauseWhenHidden, fetchNotifications]);

  /**
   * Stop the polling interval
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPolling(false);
      console.log('⏸️ [useNotificationPolling] Stopped polling');
    }
  }, []);

  /**
   * Manual refresh function
   */
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Handle visibility change
  useEffect(() => {
    if (!pauseWhenHidden) {
      return;
    }

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      isVisibleRef.current = isVisible;

      console.log('👁️ [useNotificationPolling] Visibility changed:', isVisible);

      // If tab becomes visible and polling is enabled, fetch immediately
      if (isVisible && isPolling) {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseWhenHidden, isPolling, fetchNotifications]);

  // Start/stop polling based on enabled state and user authentication
  useEffect(() => {
    if (enabled && user) {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [enabled, user, startPolling, stopPolling]);

  return {
    unreadCount,
    notifications,
    isLoading,
    error,
    refreshNotifications,
    startPolling,
    stopPolling,
    isPolling
  };
};

export default useNotificationPolling;
