import { Notification } from '../models/Notification.model.js';
import { User } from '../models/User.model.js';

export async function createNotification({ userId, title, message, type }) {
  return Notification.create({ userId, title, message, type });
}

export async function createNotifications({ notifications }) {
  if (!Array.isArray(notifications) || notifications.length === 0) return [];
  return Notification.insertMany(notifications);
}

export async function createNotificationsForStudents({ title, message, type }) {
  const students = await User.find({ role: 'STUDENT' }).select('_id');
  if (!students.length) return [];
  const payload = students.map((u) => ({ userId: u._id, title, message, type }));
  return Notification.insertMany(payload);
}
