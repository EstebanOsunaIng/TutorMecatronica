import rateLimit from 'express-rate-limit';

export const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

export const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15
});
