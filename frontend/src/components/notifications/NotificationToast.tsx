/**
 * NotificationToast Component
 *
 * Displays toast notifications for real-time updates.
 * Works in conjunction with useNotificationPolling hook.
 */

import React, { useEffect } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import type { Notification } from '../../services/notificationService';

export interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

/**
 * Get icon based on notification type
 */
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
    case 'course_completion':
    case 'certificate_issued':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'warning':
    case 'assignment_due_soon':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    case 'error':
    case 'assignment_failed':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'info':
    case 'enrollment':
    case 'progress':
    case 'quiz_completion':
      return <Info className="w-5 h-5 text-blue-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

/**
 * Get background color based on notification type
 */
const getBackgroundColor = (type: string): string => {
  switch (type) {
    case 'success':
    case 'course_completion':
    case 'certificate_issued':
      return 'bg-green-50 border-green-200';
    case 'warning':
    case 'assignment_due_soon':
      return 'bg-yellow-50 border-yellow-200';
    case 'error':
    case 'assignment_failed':
      return 'bg-red-50 border-red-200';
    case 'info':
    case 'enrollment':
    case 'progress':
    case 'quiz_completion':
    default:
      return 'bg-blue-50 border-blue-200';
  }
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}) => {
  // Auto-close after delay
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const bgColor = getBackgroundColor(notification.type);
  const icon = getNotificationIcon(notification.type);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${bgColor} animate-slide-in-right max-w-md`}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">
          {notification.title}
        </p>
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
          {notification.message}
        </p>

        {/* Action button */}
        {notification.action_url && notification.action_label && (
          <a
            href={notification.action_url}
            className="mt-2 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
            onClick={onClose}
          >
            {notification.action_label} →
          </a>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * NotificationToastContainer Component
 *
 * Container for managing multiple toast notifications.
 */
export interface NotificationToastContainerProps {
  notifications: Notification[];
  onClose: (notificationId: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
}

const getPositionClasses = (position: string): string => {
  switch (position) {
    case 'top-left':
      return 'top-4 left-4';
    case 'bottom-right':
      return 'bottom-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    case 'top-right':
    default:
      return 'top-4 right-4';
  }
};

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  notifications,
  onClose,
  position = 'top-right',
  maxVisible = 5
}) => {
  const positionClasses = getPositionClasses(position);
  const visibleNotifications = notifications.slice(0, maxVisible);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed ${positionClasses} z-50 flex flex-col gap-3 pointer-events-none`}
      aria-live="polite"
      aria-atomic="true"
    >
      {visibleNotifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationToast
            notification={notification}
            onClose={() => onClose(notification.id)}
          />
        </div>
      ))}

      {/* Show count if more notifications are hidden */}
      {notifications.length > maxVisible && (
        <div className="pointer-events-auto text-sm text-gray-500 text-center p-2 bg-white rounded-lg shadow border border-gray-200">
          +{notifications.length - maxVisible} more notifications
        </div>
      )}
    </div>
  );
};

export default NotificationToast;
