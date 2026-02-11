import crypto from 'crypto';

export function generateOtp6() {
  return String(crypto.randomInt(100000, 1000000));
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
