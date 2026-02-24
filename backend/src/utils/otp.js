import crypto from 'crypto';

export function generateOtp6() {
  return String(crypto.randomInt(100000, 1000000));
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function hashOtp(email, otp) {
  const secret = process.env.OTP_SECRET || process.env.JWT_SECRET || 'otp-fallback-secret';
  return crypto.createHmac('sha256', secret).update(`${String(email || '').toLowerCase()}:${String(otp || '')}`).digest('hex');
}
