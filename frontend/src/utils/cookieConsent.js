const CONSENT_KEY = 'cookies';
const CONSENT_PREFS_KEY = 'cookieConsentPrefs';
const CONSENT_AT_KEY = 'cookieConsentAt';

function safeRead(key) {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function safeWrite(key, value) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

export function getCookieConsent() {
  return safeRead(CONSENT_KEY);
}

export function getCookieConsentPrefs() {
  const raw = safeRead(CONSENT_PREFS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCookieConsent(mode, prefs = null) {
  safeWrite(CONSENT_KEY, String(mode));
  if (prefs) {
    safeWrite(CONSENT_PREFS_KEY, JSON.stringify(prefs));
  }
  safeWrite(CONSENT_AT_KEY, new Date().toISOString());
}

export function hasCookieConsent() {
  return Boolean(getCookieConsent());
}

export const cookieConsentKeys = {
  consent: CONSENT_KEY,
  prefs: CONSENT_PREFS_KEY,
  acceptedAt: CONSENT_AT_KEY
};
