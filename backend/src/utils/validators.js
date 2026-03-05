export function normalizeText(value = '') {
  return String(value || '').trim();
}

export function isValidName(value) {
  const text = normalizeText(value);
  return /^[A-Za-zÀ-ÿ\u00f1\u00d1\s]+$/.test(text);
}

export function isValidDocument(value) {
  return /^\d{10}$/.test(String(value || '').trim());
}

export function isValidPhone(value) {
  return /^\d{10}$/.test(String(value || '').trim());
}

export function isValidEmail(value) {
  const text = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text);
}

export function isValidPassword(value) {
  const password = String(value || '');
  if (password.length < 8 || password.length > 20) return false;
  if (/\s/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[!@#$%^&*._-]/.test(password)) return false;
  if (/[^A-Za-z\d!@#$%^&*._-]/.test(password)) return false;
  return true;
}

export const PASSWORD_POLICY_MESSAGE =
  'Contrasena invalida: usa 8-20 caracteres, con mayuscula, minuscula, numero y simbolo (!@#$%^&*._-), sin espacios.';
