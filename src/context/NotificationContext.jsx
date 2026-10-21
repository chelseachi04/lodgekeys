import { createContext, useContext, useState, useEffect, useRef } from 'react';

const NotificationContext = createContext(null);

const STORAGE_KEY_NOTIFS  = 'lodgekeys_notifications_v1';
const STORAGE_KEY_BOOKINGS = 'lodgekeys_bookings_v1';

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [bookings, setBookings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BOOKINGS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeReceipt, setActiveReceipt] = useState(null);

  // Optional callback to persist booking to user profile
  // Registered by AuthContext-aware consumers
  const addBookingToUserRef = useRef(null);
  const registerUserBookingHandler = (handler) => {
    addBookingToUserRef.current = handler;
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch (e) {
      console.error('Error saving notifications', e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
    } catch (e) {
      console.error('Error saving bookings', e);
    }
  }, [bookings]);

  const addBookingNotification = (booking) => {
    const newBooking = {
      id: booking.bookingRef || `LK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      ...booking,
    };

    const newNotification = {
      id: `notif-${Date.now()}`,
      title: `Booking Confirmed: ${booking.roomNumber} at ${booking.hotelName}`,
      message: `Your reservation (${newBooking.id}) for ${booking.dates?.nights || 1} nights has been confirmed by the front desk.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      bookingRef: newBooking.id,
      bookingData: newBooking,
    };

    setBookings((prev) => [newBooking, ...prev]);
    setNotifications((prev) => [newNotification, ...prev]);

    // Also persist to user profile if handler is registered
    if (addBookingToUserRef.current) {
      try { addBookingToUserRef.current(newBooking); } catch { /* noop */ }
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        bookings,
        unreadCount,
        addBookingNotification,
        markAllAsRead,
        clearNotification,
        activeReceipt,
        setActiveReceipt,
        registerUserBookingHandler,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
