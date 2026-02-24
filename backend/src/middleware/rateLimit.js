import rateLimit from 'express-rate-limit';

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
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonHandler('Demasiados intentos de registro. Espera unos minutos.')
});

export const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonHandler('Demasiadas solicitudes para recuperar contrasena. Intenta mas tarde.')
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
