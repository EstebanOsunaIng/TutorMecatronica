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
  const [loading, setLoading] = useState(false);
  const knownIdsRef = useRef(new Set());
  const hasLoadedRef = useRef(false);
  const refreshTimerRef = useRef(null);
  const pulseTimerRef = useRef(null);

  const token = localStorage.getItem('token');

  const refreshNotifications = async () => {
    if (!token || !user?._id) return;
    try {
      setLoading(true);
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
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = setTimeout(() => setHasNew(false), 1800);
      }
    } catch (error) {
      // ignore fetch errors to avoid blocking UI
    } finally {
      setLoading(false);
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
    if (!token || !user?._id) return;
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      // ignore
    }
  };

  const removeMany = async (ids) => {
    if (!token || !user?._id || !Array.isArray(ids) || ids.length === 0) return;
    try {
      await notificationsApi.removeMany(ids);
      setNotifications((prev) => prev.filter((n) => !ids.includes(String(n._id))));
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    setIsMuted(Boolean(user?.notificationsMuted));
  }, [user?.notificationsMuted]);

  useEffect(() => {
    if (!token || !user?._id) {
      setNotifications([]);
      knownIdsRef.current = new Set();
      hasLoadedRef.current = false;
      return;
    }

    refreshNotifications();
    refreshTimerRef.current = setInterval(refreshNotifications, 8000);
    const handleFocus = () => refreshNotifications();
    window.addEventListener('focus', handleFocus);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?._id, token, isMuted]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isMuted,
      toggleMuted,
      markRead,
      markAllRead,
      removeMany,
      hasNew,
      loading,
      refreshNotifications
    }),
    [notifications, unreadCount, isMuted, hasNew, loading]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationContext);
}
