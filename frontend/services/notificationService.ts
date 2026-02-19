export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoDismiss?: number;
}

class NotificationService {
  private listeners: Set<(notifications: NotificationItem[]) => void> = new Set();
  private notifications: NotificationItem[] = [];
  private maxNotifications = 50;

  subscribe(callback: (notifications: NotificationItem[]) => void) {
    this.listeners.add(callback);
    callback(this.notifications);
    return () => this.listeners.delete(callback);
  }

  private emit() {
    this.listeners.forEach(cb => cb([...this.notifications]));
  }

  add(notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) {
    const item: NotificationItem = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false
    };

    this.notifications.unshift(item);
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    this.emit();

    if (item.autoDismiss && item.autoDismiss > 0) {
      setTimeout(() => this.dismiss(item.id), item.autoDismiss);
    }

    return item.id;
  }

  info(title: string, message: string, autoDismiss = 5000) {
    return this.add({ type: 'info', title, message, autoDismiss });
  }

  success(title: string, message: string, autoDismiss = 4000) {
    return this.add({ type: 'success', title, message, autoDismiss });
  }

  warning(title: string, message: string, autoDismiss = 7000) {
    return this.add({ type: 'warning', title, message, autoDismiss });
  }

  error(title: string, message: string, autoDismiss = 10000) {
    return this.add({ type: 'error', title, message, autoDismiss });
  }

  dismiss(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.emit();
  }

  markAsRead(id: string) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.emit();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.emit();
  }

  clear() {
    this.notifications = [];
    this.emit();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getAll(): NotificationItem[] {
    return [...this.notifications];
  }
}

export const notificationService = new NotificationService();
