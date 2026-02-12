import { Notification } from '../models/Notification.model.js';

export async function listNotifications(req, res) {
  try {
    const { userId, unread } = req.query;
    const isAdmin = req.user?.role === 'ADMIN';
    const filter = {};

    if (isAdmin && userId) {
      filter.userId = userId;
    } else if (!isAdmin) {
      filter.userId = req.user.id;
    }

    if (String(unread) === '1') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    return res.json({ notifications });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudieron cargar las notificaciones' });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const filter = { _id: req.params.id };
    if (!isAdmin) filter.userId = req.user.id;

    const updated = await Notification.findOneAndUpdate(filter, { $set: { isRead: true } }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Notificacion no encontrada' });
    return res.json({ notification: updated });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo actualizar la notificacion' });
  }
}

export async function markAllRead(req, res) {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { $set: { isRead: true } });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudieron actualizar las notificaciones' });
  }
}

export async function deleteNotification(req, res) {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Notificacion no encontrada' });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo eliminar la notificacion' });
  }
}
