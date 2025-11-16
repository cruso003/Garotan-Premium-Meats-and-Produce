import { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, TrendingUp, Package, Award, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

export interface Notification {
  id: string;
  type: 'TIER_UPGRADE' | 'LOW_STOCK' | 'ORDER_COMPLETE' | 'SYSTEM' | 'WARNING';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load notifications from localStorage
    loadNotifications();

    // Check for low stock items
    checkLowStock();

    // Set up periodic check (every 5 minutes)
    const interval = setInterval(() => {
      checkLowStock();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Save notifications to localStorage whenever they change
    localStorage.setItem('notifications', JSON.stringify(notifications));
    const unread = notifications.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const loadNotifications = () => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      setNotifications(
        parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }))
      );
    }
  };

  const checkLowStock = async () => {
    try {
      const response = await api.get<{ success: boolean; data: any }>('/reports/dashboard');
      const data = response.data?.data || response.data;

      if (data?.alerts?.lowStock > 0) {
        addNotification({
          type: 'LOW_STOCK',
          title: 'Low Stock Alert',
          message: `${data.alerts.lowStock} items are below minimum stock level`,
          actionUrl: '/inventory',
        });
      }

      if (data?.alerts?.nearExpiry > 0) {
        addNotification({
          type: 'WARNING',
          title: 'Products Near Expiry',
          message: `${data.alerts.nearExpiry} products are expiring soon`,
          actionUrl: '/inventory',
        });
      }
    } catch (error) {
      console.error('Failed to check low stock:', error);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Check if similar notification exists in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const exists = notifications.some(
      (n) =>
        n.type === notification.type &&
        n.title === notification.title &&
        n.timestamp > oneHourAgo
    );

    if (!exists) {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'TIER_UPGRADE':
        return <Award className="h-5 w-5 text-yellow-500" />;
      case 'LOW_STOCK':
        return <Package className="h-5 w-5 text-orange-500" />;
      case 'ORDER_COMPLETE':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = (type: Notification['type']) => {
    switch (type) {
      case 'TIER_UPGRADE':
        return 'bg-yellow-50 border-yellow-200';
      case 'LOW_STOCK':
        return 'bg-orange-50 border-orange-200';
      case 'ORDER_COMPLETE':
        return 'bg-green-50 border-green-200';
      case 'WARNING':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Expose function to add notifications globally
  useEffect(() => {
    (window as any).addNotification = addNotification;
    return () => {
      delete (window as any).addNotification;
    };
  }, [notifications]);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        title="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:text-primary-dark font-medium"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-500">
                  <Bell className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50/30' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTime(notification.timestamp)}
                          </p>
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="text-xs text-primary hover:text-primary-dark font-medium mt-2 inline-block"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                              }}
                            >
                              View details →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to trigger notifications from anywhere in the app
export function triggerNotification(
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
) {
  if ((window as any).addNotification) {
    (window as any).addNotification(notification);
  }
}
