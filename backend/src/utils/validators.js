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
  return String(value || '').trim().length >= 6;
}
