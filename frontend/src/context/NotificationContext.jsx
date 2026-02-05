import React, { createContext, useContext, useMemo, useState } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (payload) => {
    setNotifications((prev) => [{ id: Date.now(), ...payload }, ...prev]);
  };

  const value = useMemo(() => ({ notifications, addNotification }), [notifications]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationContext);
}
