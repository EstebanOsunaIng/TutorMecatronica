export const PASSWORD_POLICY_HINT =
  'Usa 8-20 caracteres con mayuscula, minuscula, numero y simbolo (!@#$%^&*._-), sin espacios.';

export function isStrongPassword(value) {
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
