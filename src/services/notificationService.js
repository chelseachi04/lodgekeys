import { STORAGE_KEYS } from './storageKeys';

export const notificationService = {
  getNotifications() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveNotifications(notifications) {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      return notifications;
    } catch (e) {
      console.error('Failed saving notifications', e);
      return notifications;
    }
  },

  addNotification(bookingData) {
    const current = notificationService.getNotifications();
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: `Booking Confirmed: ${bookingData.roomNumber} at ${bookingData.hotelName}`,
      message: `Your reservation (${bookingData.id || bookingData.bookingRef}) has been confirmed by the front desk.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      bookingRef: bookingData.id || bookingData.bookingRef,
      bookingData,
    };
    const updated = [newNotif, ...current];
    notificationService.saveNotifications(updated);
    return newNotif;
  },

  markAllAsRead() {
    const current = notificationService.getNotifications();
    const updated = current.map((n) => ({ ...n, read: true }));
    return notificationService.saveNotifications(updated);
  },

  clearNotification(id) {
    const current = notificationService.getNotifications();
    const updated = current.filter((n) => n.id !== id);
    return notificationService.saveNotifications(updated);
  },
};
