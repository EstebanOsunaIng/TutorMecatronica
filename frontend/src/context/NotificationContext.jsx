import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { notificationsApi } from '../api/notifications.api.js';
import { usersApi } from '../api/users.api.js';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, setUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isMuted, setIsMuted] = useState(Boolean(user?.notificationsMuted));
  const [hasNew, setHasNew] = useState(false);
  const knownIdsRef = useRef(new Set());
  const hasLoadedRef = useRef(false);
  const refreshTimerRef = useRef(null);

  const refreshNotifications = async () => {
    try {
      const res = await notificationsApi.list();
      const list = res.data?.notifications || [];
      const nextIds = new Set(list.map((n) => String(n._id)));
      let hasNewItems = false;
      if (hasLoadedRef.current) {
        nextIds.forEach((id) => {
          if (!knownIdsRef.current.has(id)) hasNewItems = true;
        });
      }
      knownIdsRef.current = nextIds;
      hasLoadedRef.current = true;
      setNotifications(list);
      if (hasNewItems && !isMuted) {
        setHasNew(true);
        setTimeout(() => setHasNew(false), 1800);
      }
    } catch (error) {
      // ignore fetch errors to avoid blocking UI
    }
  };

  const toggleMuted = async () => {
    const next = !isMuted;
    setIsMuted(next);
    try {
      const res = await usersApi.updateMe({ notificationsMuted: next });
      const nextUser = res.data?.user;
      if (nextUser) {
        localStorage.setItem('user', JSON.stringify(nextUser));
        setUser(nextUser);
      }
    } catch (error) {
      setIsMuted((prev) => !prev);
    }
  };

  const markRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (String(n._id) === String(id) ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    setIsMuted(Boolean(user?.notificationsMuted));
  }, [user?.notificationsMuted]);

  useEffect(() => {
    refreshNotifications();
    refreshTimerRef.current = setInterval(refreshNotifications, 8000);
    const handleFocus = () => refreshNotifications();
    window.addEventListener('focus', handleFocus);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isMuted]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const value = useMemo(
    () => ({ notifications, unreadCount, isMuted, toggleMuted, markRead, markAllRead, hasNew, refreshNotifications }),
    [notifications, unreadCount, isMuted, hasNew]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationContext);
}
