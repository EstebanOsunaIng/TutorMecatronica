import rateLimit from 'express-rate-limit';

const jsonHandler = (message) => ({ message });

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonHandler('Demasiados intentos de inicio de sesion. Intenta de nuevo en 15 minutos.')
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
