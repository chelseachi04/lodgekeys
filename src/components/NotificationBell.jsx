import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, CalendarCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import './NotificationBell.css';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, clearNotification, setActiveReceipt } = useNotifications();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenDropdown = () => {
    setOpen(!open);
    if (!open && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleViewReceipt = (notif) => {
    if (notif.bookingData) {
      setActiveReceipt(notif.bookingData);
      setOpen(false);
    }
  };

  return (
    <div className="notif-bell-container" ref={dropdownRef}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={handleOpenDropdown}
        aria-label="Notifications"
        title="View reservation notifications"
      >
        <Bell size={18} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown__header">
            <div className="notif-dropdown__title-wrap">
              <span className="notif-dropdown__title">Notifications</span>
              {notifications.length > 0 && (
                <span className="notif-dropdown__count">{notifications.length}</span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                className="notif-clear-all"
                onClick={markAllAsRead}
              >
                Mark read
              </button>
            )}
          </div>

          <div className="notif-dropdown__body">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <CalendarCheck size={28} className="notif-empty__icon" />
                <p className="notif-empty__text">No reservation updates yet.</p>
                <span className="notif-empty__hint">
                  Your confirmed room vouchers and desk holds will appear here.
                </span>
              </div>
            ) : (
              <ul className="notif-list">
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className={`notif-item ${!notif.read ? 'notif-item--unread' : ''}`}
                    onClick={() => handleViewReceipt(notif)}
                  >
                    <div className="notif-item__icon-wrap">
                      <CalendarCheck size={16} />
                    </div>
                    <div className="notif-item__content">
                      <div className="notif-item__header">
                        <strong className="notif-item__title">{notif.title}</strong>
                        <span className="notif-item__time">{notif.timestamp}</span>
                      </div>
                      <p className="notif-item__msg">{notif.message}</p>
                      {notif.bookingData && (
                        <div className="notif-item__action">
                          <span>View Official Receipt</span>
                          <ExternalLink size={12} />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
