import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function forgotPasswordKeyGenerator(req) {
  const ipKey = ipKeyGenerator(req.ip || req.socket?.remoteAddress || 'unknown');
  const email = normalizeEmail(req.body?.email);
  if (!email) return ipKey;
  return `${ipKey}:${email}`;
}

const jsonHandler = (message) => ({ message });

export const loginLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonHandler('Demasiados intentos de inicio de sesion. Intenta de nuevo en 30 segundos.')
});

export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonHandler('Demasiados registros desde esta red. Intenta mas tarde.')
});

export const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  keyGenerator: forgotPasswordKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonHandler('Demasiadas solicitudes para recuperar contrasena para este correo. Intenta mas tarde.')
});

export const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonHandler('Demasiados intentos de cambio de contrasena. Intenta mas tarde.')
});

export const changePasswordRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonHandler('Demasiadas solicitudes de confirmacion. Espera unos minutos.')
});

export const emailVerifyRequestIpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonHandler('Espera un momento antes de solicitar otra verificacion.')
});

export const verifyCodeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonHandler('Demasiados intentos de verificacion. Espera unos minutos.')
});
